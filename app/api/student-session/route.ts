import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { students } from "../../../db/schema";
import { getSessionUser } from "../../auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "student") return Response.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });
  if (!user.studentId) return Response.json({ pending: true, name: user.name });

  const db = getDb();
  const [student] = await db.select({ id: students.id, name: students.name, grade: students.grade, color: students.color, score: students.score, trend: students.trend, risk: students.risk })
    .from(students).where(eq(students.id, user.studentId)).limit(1);
  if (!student) return Response.json({ pending: true, name: user.name });
  return Response.json({ student });
}
