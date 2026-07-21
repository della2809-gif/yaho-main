import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const academySettings = sqliteTable("academy_settings", {
  id: integer("id").primaryKey(),
  academyName: text("academy_name").notNull(),
  branchName: text("branch_name").notNull(),
  className: text("class_name").notNull(),
  teacherName: text("teacher_name").notNull(),
  teacherRole: text("teacher_role").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  score: integer("score").notNull().default(0),
  trend: text("trend").notNull().default("0"),
  risk: text("risk").notNull().default("없음"),
  color: text("color").notNull().default("#5368e8"),
  sortOrder: integer("sort_order").notNull().default(0),
  email: text("email"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  provider: text("provider").notNull().default("local"),
  providerId: text("provider_id"),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  studentId: text("student_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const mistakeSubmissions = sqliteTable("mistake_submissions", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  fileSize: integer("file_size").notNull(),
  note: text("note").notNull().default(""),
  subject: text("subject").notNull().default(""),
  topic: text("topic").notNull().default(""),
  status: text("status").notNull().default("제출됨"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
