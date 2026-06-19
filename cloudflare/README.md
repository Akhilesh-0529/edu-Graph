# Cloudflare Tunnel Configuration for Chatbot UI

This directory contains the files and instructions to set up a secure Cloudflare Tunnel. This allows your frontend application deployed on **Vercel** to securely communicate with your local **Supabase** backend running on your machine, while keeping local development (`localhost:3000`) functioning seamlessly.

---

## How it Works

```
Vercel Frontend (Cloud) ──[HTTPS]──> Cloudflare Edge ──[Secure Tunnel]──> cloudflared (Local) ──> Kong API Gateway (http://localhost:54321)
```

By tunneling your local Kong Gateway (port `54321`), Vercel can securely perform database, authentication, and storage operations on your local machine using standard HTTPS request routing.

---

## Option 1: Ad-Hoc Quick Tunnel (Free, No Setup Required)

This is the fastest way to test Vercel deployments. It generates a temporary public URL (e.g. `https://xxx.trycloudflare.com`) pointing to your local backend.

### 1. Install Cloudflared CLI
* **macOS (via Homebrew)**:
  ```bash
  brew install cloudflare/cloudflare/cloudflared
  ```
* **Windows (via Winget)**:
  ```cmd
  winget install Cloudflare.cloudflared
  ```

### 2. Start the Quick Tunnel
Start your local dev stack (`npm run chat`), and then run:
```bash
npm run tunnel
```
*(This uses `cloudflared tunnel --url http://localhost:54321` internally)*.

### 3. Configure Vercel
Copy the generated URL (e.g. `https://your-tunnel-subdomain.trycloudflare.com`) and paste it as the `NEXT_PUBLIC_SUPABASE_URL` in your Vercel project environment variables.

---

## Option 2: Persistent Tunnel (Recommended for Production / Custom Domains)

This assigns a permanent, secure subdomain (e.g., `supabase.yourdomain.com`) to your local backend.

### 1. Authenticate with Cloudflare
Login to your Cloudflare account via the CLI:
```bash
cloudflared tunnel login
```

### 2. Create the Tunnel
Create a named tunnel (e.g., `supabase-local`):
```bash
cloudflared tunnel create supabase-local
```
This generates a JSON credentials file on your system (e.g., `~/.cloudflared/<TUNNEL_ID>.json`) and displays a `<TUNNEL_ID>`.

### 3. Configure the Tunnel
1. Copy the `config.example.yml` file to `config.yml`:
   ```bash
   cp cloudflare/config.example.yml cloudflare/config.yml
   ```
2. Open `cloudflare/config.yml` and replace:
   * `<YOUR_TUNNEL_ID>` with your generated Tunnel ID.
   * `supabase.yourdomain.com` with the custom domain or subdomain you want to use.
   * `/path/to/your/credentials.json` with the absolute path to your generated JSON credentials file.

### 4. Create DNS Routing
Route traffic from your subdomain to the tunnel:
```bash
cloudflared tunnel route dns supabase-local supabase.yourdomain.com
```

### 5. Run the Tunnel
Start the tunnel using your configuration file:
```bash
cloudflared tunnel --config cloudflare/config.yml run supabase-local
```

### 6. Configure Vercel Environment Variables
Set your Vercel project variables to point to your new subdomain:
* `NEXT_PUBLIC_SUPABASE_URL` = `https://supabase.yourdomain.com`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(your local project's anon key)*
* `SUPABASE_SERVICE_ROLE_KEY` = *(your local project's service role key)*
