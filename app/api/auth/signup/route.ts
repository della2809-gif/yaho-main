import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createSession, hashPassword, isSecureRequest, linkStudentAccount, normalizeEmail, setSessionCookie } from "../../../auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; name?: string; role?: string; code?: string };
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim().slice(0, 40);
    const role = body.role === "teacher" ? "teacher" : body.role === "student" ? "student" : "";

    if (!EMAIL_RE.test(email)) return Response.json({ error: "올바른 이메일을 입력해 주세요." }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    if (!name) return Response.json({ error: "이름을 입력해 주세요." }, { status: 400 });
    if (!role) return Response.json({ error: "가입 유형을 선택해 주세요." }, { status: 400 });

    if (role === "teacher") {
      const requiredCode = (process.env.TEACHER_SIGNUP_CODE ?? "").trim();
      if (!requiredCode || String(body.code ?? "").trim() !== requiredCode) {
        return Response.json({ error: "선생님 가입 코드가 올바르지 않습니다." }, { status: 403 });
      }
    }

    const db = getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return Response.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });

    const { hash, salt } = await hashPassword(password);
    const id = crypto.randomUUID();
    await db.insert(users).values({ id, email, name, role, provider: "local", passwordHash: hash, passwordSalt: salt });
    if (role === "student") await linkStudentAccount(id, email);

    const sessionId = await createSession(id);
    await setSessionCookie(sessionId, isSecureRequest(request));
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "회원가입에 실패했습니다." }, { status: 500 });
  }
}
