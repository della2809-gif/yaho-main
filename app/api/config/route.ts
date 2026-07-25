import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { academySettings, students, users } from "../../../db/schema";
import { getSessionUser, linkPendingUserToStudent, normalizeEmail } from "../../auth";

const now = sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`;

async function requireTeacher() {
  const user = await getSessionUser();
  return user?.role === "teacher" ? user : null;
}

async function linkedStudentIds(db: ReturnType<typeof getDb>) {
  const rows = await db.select({ studentId: users.studentId }).from(users);
  return new Set(rows.map((row) => row.studentId).filter((id): id is string => Boolean(id)));
}

async function withLinked(db: ReturnType<typeof getDb>, studentRows: (typeof students.$inferSelect)[]) {
  const linked = await linkedStudentIds(db);
  return studentRows.map((row) => ({ ...row, linked: linked.has(row.id) }));
}

const defaultSettings = {
  id: 1,
  academyName: "매쓰온 수학학원",
  branchName: "중등관",
  className: "A반",
  teacherName: "한수진",
  teacherRole: "원장 · 관리자",
};

const defaultStudents = [
  { id: "gah-001", name: "김가희", grade: "중1", score: 72, trend: "+8", risk: "부호 계산", color: "#5368e8", sortOrder: 1 },
  { id: "seo-002", name: "박서준", grade: "중1", score: 84, trend: "+3", risk: "좌표", color: "#32b99a", sortOrder: 2 },
  { id: "hae-003", name: "이하은", grade: "중1", score: 61, trend: "−4", risk: "분수 계산", color: "#ef7866", sortOrder: 3 },
  { id: "min-004", name: "정민우", grade: "중1", score: 77, trend: "+6", risk: "문자식", color: "#e3a82b", sortOrder: 4 },
  { id: "you-005", name: "최유진", grade: "중1", score: 89, trend: "+2", risk: "없음", color: "#7c66cf", sortOrder: 5 },
];

async function ensureDefaults() {
  const db = getDb();
  const [existingSettings] = await db.select({ id: academySettings.id }).from(academySettings).where(eq(academySettings.id, 1)).limit(1);
  if (!existingSettings) {
    await db.insert(academySettings).values(defaultSettings);
    await db.insert(students).values(defaultStudents).onConflictDoNothing();
  }
  return db;
}

const grades = ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"];
const colors = ["#5368e8", "#32b99a", "#ef7866", "#e3a82b", "#7c66cf", "#3b91d7"];

function cleanStudent(student: Partial<(typeof defaultStudents)[number]> & { email?: string }) {
  const grade = String(student.grade ?? "").trim();
  return {
    name: String(student.name ?? "").trim().slice(0, 20),
    grade: grades.includes(grade) ? grade : "",
    score: Math.max(0, Math.min(100, Number(student.score) || 0)),
    trend: String(student.trend ?? "0").trim().slice(0, 10),
    risk: String(student.risk ?? "없음").trim().slice(0, 30) || "없음",
    email: student.email ? normalizeEmail(String(student.email)).slice(0, 80) : "",
  };
}

export async function GET() {
  try {
    if (!await requireTeacher()) return Response.json({ error: "선생님 권한이 필요합니다." }, { status: 403 });
    const db = await ensureDefaults();
    const [settings] = await db.select().from(academySettings).where(eq(academySettings.id, 1)).limit(1);
    const studentRows = await db.select().from(students).orderBy(asc(students.sortOrder));
    return Response.json({ settings, students: await withLinked(db, studentRows) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "설정을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!await requireTeacher()) return Response.json({ error: "선생님 권한이 필요합니다." }, { status: 403 });
    const payload = (await request.json()) as {
      settings?: Partial<typeof defaultSettings>;
      student?: Partial<(typeof defaultStudents)[number]> & { id?: string; email?: string };
    };
    const db = await ensureDefaults();

    if (payload.settings) {
      const clean = {
        academyName: String(payload.settings.academyName ?? "").trim().slice(0, 40),
        branchName: String(payload.settings.branchName ?? "").trim().slice(0, 20),
        className: String(payload.settings.className ?? "").trim().slice(0, 20),
        teacherName: String(payload.settings.teacherName ?? "").trim().slice(0, 20),
        teacherRole: String(payload.settings.teacherRole ?? "").trim().slice(0, 30),
      };
      if (Object.values(clean).some((value) => !value)) return Response.json({ error: "모든 항목을 입력해 주세요." }, { status: 400 });
      await db.update(academySettings).set({ ...clean, updatedAt: now }).where(eq(academySettings.id, 1));
    }

    if (payload.student?.id) {
      const clean = cleanStudent(payload.student);
      if (!clean.name || !clean.grade) return Response.json({ error: "학생 이름과 학년을 입력해 주세요." }, { status: 400 });
      await db.update(students).set({ ...clean, updatedAt: now }).where(eq(students.id, payload.student.id));
      if (clean.email) await linkPendingUserToStudent(payload.student.id, clean.email);
    }

    const [settings] = await db.select().from(academySettings).where(eq(academySettings.id, 1)).limit(1);
    const studentRows = await db.select().from(students).orderBy(asc(students.sortOrder));
    return Response.json({ settings, students: await withLinked(db, studentRows) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "저장하지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!await requireTeacher()) return Response.json({ error: "선생님 권한이 필요합니다." }, { status: 403 });
    const db = await ensureDefaults();
    const payload = (await request.json()) as { student?: Partial<(typeof defaultStudents)[number]> & { email?: string } };
    const clean = cleanStudent(payload.student ?? {});
    if (!clean.name || !clean.grade) return Response.json({ error: "학생 이름과 학년을 입력해 주세요." }, { status: 400 });
    const [last] = await db.select({ sortOrder: students.sortOrder }).from(students).orderBy(desc(students.sortOrder)).limit(1);
    const sortOrder = (last?.sortOrder ?? 0) + 1;
    const id = crypto.randomUUID();
    await db.insert(students).values({ id, ...clean, color: colors[(sortOrder - 1) % colors.length], sortOrder });
    if (clean.email) await linkPendingUserToStudent(id, clean.email);
    const [settings] = await db.select().from(academySettings).where(eq(academySettings.id, 1)).limit(1);
    const studentRows = await db.select().from(students).orderBy(asc(students.sortOrder));
    return Response.json({ settings, students: await withLinked(db, studentRows) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "학생을 추가하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await requireTeacher()) return Response.json({ error: "선생님 권한이 필요합니다." }, { status: 403 });
    const db = await ensureDefaults();
    const payload = (await request.json()) as { id?: string };
    if (!payload.id) return Response.json({ error: "삭제할 학생을 선택해 주세요." }, { status: 400 });
    await db.delete(students).where(eq(students.id, payload.id));
    const [settings] = await db.select().from(academySettings).where(eq(academySettings.id, 1)).limit(1);
    const studentRows = await db.select().from(students).orderBy(asc(students.sortOrder));
    return Response.json({ settings, students: await withLinked(db, studentRows) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "학생을 삭제하지 못했습니다." }, { status: 500 });
  }
}
