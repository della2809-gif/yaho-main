import { signState } from "../../../auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const restApiKey = process.env.KAKAO_REST_API_KEY ?? "";
  if (!restApiKey) return Response.redirect(`${url.origin}/login?error=kakao_not_configured`, 302);

  const role = url.searchParams.get("role") === "teacher" ? "teacher" : "student";
  const state = await signState({ role, nonce: crypto.randomUUID() });
  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", restApiKey);
  authorizeUrl.searchParams.set("redirect_uri", `${url.origin}/api/auth/kakao/callback`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);
  return Response.redirect(authorizeUrl.toString(), 302);
}
