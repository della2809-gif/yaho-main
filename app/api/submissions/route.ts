import { desc, eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { getDb } from "../../../db";
import { mistakeSubmissions, students } from "../../../db/schema";
import { getSessionUser } from "../../auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxBytes = 15 * 1024 * 1024;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const db = getDb();

  if (user.role === "student") {
    if (!user.studentId) return Response.json({ submissions: [] });
    const rows = await db.select().from(mistakeSubmissions)
      .where(eq(mistakeSubmissions.studentId, user.studentId)).orderBy(desc(mistakeSubmissions.createdAt)).limit(100);
    return Response.json({ submissions: rows.map((row) => ({ ...row, student: null })) });
  }

  const rows = await db.select().from(mistakeSubmissions).orderBy(desc(mistakeSubmissions.createdAt)).limit(100);
  const studentRows = await db.select({ id: students.id, name: students.name, grade: students.grade }).from(students);
  const names = new Map(studentRows.map((student) => [student.id, student]));
  return Response.json({ submissions: rows.map((row) => ({ ...row, student: names.get(row.studentId) ?? null })) });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student" || !user.studentId) {
      return Response.json({ error: "학생 계정으로 로그인해야 제출할 수 있습니다." }, { status: 403 });
    }
    const studentId = user.studentId;

    const form = await request.formData();
    const note = String(form.get("note") ?? "").trim().slice(0, 500);
    const subject = String(form.get("subject") ?? "").trim().slice(0, 60);
    const topic = String(form.get("topic") ?? "").trim().slice(0, 60);
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "제출 정보가 부족합니다." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return Response.json({ error: "JPG, PNG, WEBP 또는 PDF 파일만 올릴 수 있습니다." }, { status: 415 });
    if (file.size > maxBytes) return Response.json({ error: "파일은 15MB 이하만 올릴 수 있습니다." }, { status: 413 });

    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_").slice(-120) || "problem";
    const pathname = `submissions/${studentId}/${id}/${safeName}`;
    const blob = await put(pathname, file, { access: "public", contentType: file.type });
    const db = getDb();
    await db.insert(mistakeSubmissions).values({ id, studentId, fileKey: blob.url, fileName: file.name.slice(0, 180), contentType: file.type, fileSize: file.size, note, subject, topic });
    return Response.json({ id, message: "학원에 제출되었습니다." }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "제출하지 못했습니다." }, { status: 500 });
  }
}
