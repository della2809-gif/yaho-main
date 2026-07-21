import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { mistakeSubmissions } from "../../../../../db/schema";
import { getSessionUser } from "../../../../auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await context.params;
  const db = getDb();
  const [submission] = await db.select().from(mistakeSubmissions).where(eq(mistakeSubmissions.id, id)).limit(1);
  if (!submission) return Response.json({ error: "제출물을 찾을 수 없습니다." }, { status: 404 });

  if (user.role === "student" && submission.studentId !== user.studentId) {
    return Response.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  const blobResponse = await fetch(submission.fileKey);
  if (!blobResponse.ok || !blobResponse.body) return Response.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  const headers = new Headers();
  headers.set("content-type", submission.contentType);
  headers.set("content-disposition", `inline; filename*=UTF-8''${encodeURIComponent(submission.fileName)}`);
  headers.set("cache-control", "private, max-age=60");
  return new Response(blobResponse.body, { headers });
}
