import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { sessions, students, users } from "../db/schema";

const SESSION_COOKIE = "session_id";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const STATE_TTL_MS = 10 * 60 * 1000;
const PBKDF2_ITERATIONS = 100_000;

export type Role = "teacher" | "student";
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentId: string | null;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, keyMaterial, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return { hash: bytesToHex(hash), salt: bytesToHex(salt) };
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const computed = await pbkdf2(password, hexToBytes(salt));
  return timingSafeEqual(bytesToHex(computed), hash);
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function sessionSecret() {
  const secret = (env as unknown as { SESSION_SECRET?: string }).SESSION_SECRET ?? "";
  if (!secret) throw new Error("SESSION_SECRET이 설정되지 않았습니다.");
  return secret;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signState(payload: Record<string, unknown>) {
  const key = await hmacKey(sessionSecret());
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ ...payload, ts: Date.now() })));
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyState<T extends Record<string, unknown>>(token: string): Promise<T | null> {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const key = await hmacKey(sessionSecret());
    const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    if (!timingSafeEqual(base64UrlEncode(new Uint8Array(expectedSig)), sig)) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as T & { ts?: number };
    if (typeof payload.ts !== "number" || Date.now() - payload.ts > STATE_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isSecureRequest(request: Request) {
  const url = new URL(request.url);
  return url.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
}

export async function createSession(userId: string) {
  const db = getDb();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.insert(sessions).values({ id, userId, expiresAt });
  return id;
}

export async function setSessionCookie(sessionId: string, secure: boolean) {
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionId, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: SESSION_TTL_MS / 1000 });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getDb();
  const [row] = await db.select({ session: sessions, user: users }).from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id)).where(eq(sessions.id, sessionId)).limit(1);
  if (!row) return null;
  if (new Date(row.session.expiresAt).getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }
  return { id: row.user.id, email: row.user.email, name: row.user.name, role: row.user.role as Role, studentId: row.user.studentId };
}

export async function destroySession() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  await clearSessionCookie();
}

export async function linkStudentAccount(userId: string, normalizedEmail: string) {
  const db = getDb();
  const [student] = await db.select({ id: students.id }).from(students).where(eq(students.email, normalizedEmail)).limit(1);
  if (!student) return;
  const [alreadyLinked] = await db.select({ id: users.id }).from(users).where(eq(users.studentId, student.id)).limit(1);
  if (alreadyLinked) return;
  await db.update(users).set({ studentId: student.id }).where(eq(users.id, userId));
}

export async function linkPendingUserToStudent(studentId: string, normalizedEmail: string) {
  if (!normalizedEmail) return;
  const db = getDb();
  const [alreadyLinked] = await db.select({ id: users.id }).from(users).where(eq(users.studentId, studentId)).limit(1);
  if (alreadyLinked) return;
  const [pendingUser] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.email, normalizedEmail), eq(users.role, "student"))).limit(1);
  if (!pendingUser) return;
  await db.update(users).set({ studentId }).where(eq(users.id, pendingUser.id));
}
