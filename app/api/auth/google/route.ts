import { env } from "cloudflare:workers";
import { signState } from "../../../auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = (env as unknown as { GOOGLE_CLIENT_ID?: string }).GOOGLE_CLIENT_ID ?? "";
  if (!clientId) return Response.redirect(`${url.origin}/?error=google_not_configured`, 302);

  const role = url.searchParams.get("role") === "teacher" ? "teacher" : "student";
  const state = await signState({ role, nonce: crypto.randomUUID() });
  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", `${url.origin}/api/auth/google/callback`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "select_account");
  return Response.redirect(authorizeUrl.toString(), 302);
}
