import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { users } from "../../../../../db/schema";
import { createSession, isSecureRequest, linkStudentAccount, normalizeEmail, setSessionCookie, verifyState } from "../../../../auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) return Response.redirect(`${url.origin}/login?error=google_not_configured`, 302);
  if (!code || !stateToken) return Response.redirect(`${url.origin}/login?error=google_failed`, 302);

  const state = await verifyState<{ role: "teacher" | "student" }>(stateToken);
  if (!state) return Response.redirect(`${url.origin}/login?error=google_failed`, 302);

  try {
    const redirectUri = `${url.origin}/api/auth/google/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    if (!tokenResponse.ok) throw new Error("token exchange failed");
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) throw new Error("no access token");

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileResponse.ok) throw new Error("profile fetch failed");
    const profile = (await profileResponse.json()) as { sub?: string; email?: string; name?: string };
    if (!profile.sub || !profile.email) throw new Error("incomplete profile");

    const email = normalizeEmail(profile.email);
    const name = (profile.name ?? email).slice(0, 40);
    const db = getDb();

    let [user] = await db.select().from(users).where(eq(users.providerId, profile.sub)).limit(1);
    if (!user) {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingByEmail) {
        await db.update(users).set({ provider: "google", providerId: profile.sub }).where(eq(users.id, existingByEmail.id));
        user = { ...existingByEmail, provider: "google", providerId: profile.sub };
      } else {
        const id = crypto.randomUUID();
        await db.insert(users).values({ id, email, name, role: state.role, provider: "google", providerId: profile.sub });
        [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (user && user.role === "student") await linkStudentAccount(user.id, email);
      }
    }
    if (!user) throw new Error("user resolution failed");

    const sessionId = await createSession(user.id);
    await setSessionCookie(sessionId, isSecureRequest(request));
    return Response.redirect(`${url.origin}/`, 302);
  } catch {
    return Response.redirect(`${url.origin}/login?error=google_failed`, 302);
  }
}
