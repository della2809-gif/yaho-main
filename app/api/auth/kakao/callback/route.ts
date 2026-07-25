import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { users } from "../../../../../db/schema";
import { createSession, isSecureRequest, linkStudentAccount, normalizeEmail, setSessionCookie, verifyState } from "../../../../auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");
  const restApiKey = process.env.KAKAO_REST_API_KEY ?? "";
  const clientSecret = process.env.KAKAO_CLIENT_SECRET ?? "";
  if (!restApiKey) return Response.redirect(`${url.origin}/login?error=kakao_not_configured`, 302);
  if (!code || !stateToken) return Response.redirect(`${url.origin}/login?error=kakao_failed`, 302);

  const state = await verifyState<{ role: "teacher" | "student" }>(stateToken);
  if (!state) return Response.redirect(`${url.origin}/login?error=kakao_failed`, 302);

  try {
    const tokenBody = new URLSearchParams({ grant_type: "authorization_code", client_id: restApiKey, redirect_uri: `${url.origin}/api/auth/kakao/callback`, code });
    if (clientSecret) tokenBody.set("client_secret", clientSecret);
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });
    if (!tokenResponse.ok) throw new Error("token exchange failed");
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) throw new Error("no access token");

    const profileResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileResponse.ok) throw new Error("profile fetch failed");
    const profile = (await profileResponse.json()) as { id?: number; kakao_account?: { email?: string; profile?: { nickname?: string } } };
    if (!profile.id) throw new Error("incomplete profile");

    const providerId = String(profile.id);
    const rawEmail = profile.kakao_account?.email;
    const nickname = profile.kakao_account?.profile?.nickname ?? "카카오 사용자";
    const db = getDb();

    let [user] = await db.select().from(users).where(eq(users.providerId, providerId)).limit(1);
    if (!user) {
      const email = rawEmail ? normalizeEmail(rawEmail) : `kakao-${providerId}@no-email.local`;
      if (rawEmail) {
        const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingByEmail) {
          await db.update(users).set({ provider: "kakao", providerId }).where(eq(users.id, existingByEmail.id));
          user = { ...existingByEmail, provider: "kakao", providerId };
        }
      }
      if (!user) {
        const id = crypto.randomUUID();
        await db.insert(users).values({ id, email, name: nickname.slice(0, 40), role: state.role, provider: "kakao", providerId });
        [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (user && user.role === "student" && rawEmail) await linkStudentAccount(user.id, email);
      }
    }
    if (!user) throw new Error("user resolution failed");

    const sessionId = await createSession(user.id);
    await setSessionCookie(sessionId, isSecureRequest(request));
    return Response.redirect(`${url.origin}/`, 302);
  } catch {
    return Response.redirect(`${url.origin}/login?error=kakao_failed`, 302);
  }
}
