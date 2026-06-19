# Running edu-Graph with Docker + Supabase + Ollama

This repo is a Next.js 14 app (Chatbot UI) that talks to three things:

1. **Supabase** — Postgres, Auth, Storage. Run via the Supabase CLI (`supabase start`), which manages its own Docker containers in the background. This is the standard way to run Supabase locally — don't try to replace it with a hand-written compose file.
2. **Ollama** — serves the `gemma2:2b` model locally. Run via `docker-compose.yml` in this repo, or natively.
3. **The Next.js app itself** — also run via `docker-compose.yml`.

Why this app is split into two Docker layers instead of one `docker-compose.yml` for everything: the Supabase CLI generates and version-locks its own compose config per Supabase CLI release, and hand-merging it into a custom file tends to drift out of sync after CLI upgrades. Keeping Supabase on its own CLI-managed lifecycle and only compose-managing the app + Ollama is more stable.

## 1. Start Supabase

```bash
npx supabase start
```

This prints output like:

```
API URL: http://127.0.0.1:54321
anon key: eyJ...
service_role key: eyJ...
```

Copy those three values — you need them in step 2.

## 2. Create your env file

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from step 1>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from step 1>
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
```

**Important — read this before debugging "login page won't load":** `NEXT_PUBLIC_*` variables are inlined into the browser bundle at *build time*, and the Ollama call happens directly from the browser tab, not through the Next.js server. So `NEXT_PUBLIC_OLLAMA_URL` must be a URL your browser can reach — `http://localhost:11434` is correct when Ollama is exposed on your host's port 11434 (which `docker-compose.yml` here does). It would NOT work as `http://ollama:11434` — that hostname only resolves inside the Docker network, not from your browser.

Likewise `NEXT_PUBLIC_SUPABASE_URL` must be the host-reachable Supabase URL (`http://127.0.0.1:54321`), since the browser calls it directly for auth.

## 3. Run database migrations

```bash
npm run db-migrate
```

This applies everything in `supabase/migrations`, including the `workspaces`, `profiles`, and pgvector setup that `middleware.ts` and the login page depend on. **If you skip this step, signing up will silently fail** — `signUp` in `app/[locale]/login/page.tsx` redirects to `/setup` to create a profile/home-workspace, and middleware throws if no home workspace exists yet for a logged-in user, which can look like the login page is broken.

## 4. Build and run the app + Ollama

```bash
docker compose up --build
```

This builds the Next.js image (multi-stage `Dockerfile`, using `output: "standalone"`) and starts Ollama in its own container, both joined on the `edu-graph` Docker network. Ollama's port is published to your host (`11434:11434`) specifically so the browser-side fetch in step 2 can reach it.

Pull the model into the running Ollama container once it's up:

```bash
docker exec -it edu-graph-ollama ollama pull gemma2:2b
```

## 5. Open the app

Go to `http://localhost:3000`. `middleware.ts` will redirect `/` to `/login` since there's no session yet. Sign up, which redirects to `/setup` to create your profile and home workspace, then into `/[workspaceId]/chat`.

## Common "login page won't attach" causes, in order of likelihood

1. **Migrations never ran** — `workspaces` table doesn't exist or is empty for the user, so `middleware.ts`/`login/page.tsx` throw on the `.single()` workspace lookup after a session exists. Fix: `npm run db-migrate`.
2. **`NEXT_PUBLIC_SUPABASE_URL` mismatch** — pointing at the wrong port (e.g. `54322`, which is Postgres, not the API on `54321`), or set at runtime when it needed to be set at *build* time for the Docker image. Fix: pass it as a build arg (already wired into `docker-compose.yml`'s `build.args`), not just an env var at runtime.
3. **Mixing `localhost` and Docker service names** — `NEXT_PUBLIC_*` values must be host-reachable, not Docker-network-only hostnames.
4. **Email confirmation required** — by default Supabase requires email confirmation for sign-up. For local dev, either check the Supabase Studio's Inbucket-style mail capture, or set `enable_confirmations = false` under `[auth.email]` in `supabase/config.toml`.
