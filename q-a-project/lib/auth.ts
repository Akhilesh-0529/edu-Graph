/**
 * Auth helper that tries Clerk auth first, then falls back to a demo user ID.
 * This allows the app to run without configured Clerk keys during development.
 *
 * TODO(security): In production, remove the fallback and require real authentication.
 */

const DEMO_USER_ID = "demo-user-local";

export async function getAuthUserId(): Promise<string> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    if (session?.userId) {
      return session.userId;
    }
  } catch {
    // Clerk not configured or keys invalid — fall through to demo mode
  }

  console.warn("[AUTH] Clerk unavailable. Using demo user ID for local development.");
  return DEMO_USER_ID;
}
