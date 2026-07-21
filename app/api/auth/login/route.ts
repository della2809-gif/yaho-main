import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createSession, isSecureRequest, normalizeEmail, setSessionCookie, verifyPassword } from "../../../auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    if (!email || !password) return Response.json({ error: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.passwordHash || !user.passwordSalt) {
      return Response.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!valid) return Response.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });

    const sessionId = await createSession(user.id);
    await setSessionCookie(sessionId, isSecureRequest(request));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "로그인에 실패했습니다." }, { status: 500 });
  }
}
