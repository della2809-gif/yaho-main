CREATE TABLE "academy_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"academy_name" text NOT NULL,
	"branch_name" text NOT NULL,
	"class_name" text NOT NULL,
	"teacher_name" text NOT NULL,
	"teacher_role" text NOT NULL,
	"updated_at" text DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mistake_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"topic" text DEFAULT '' NOT NULL,
	"status" text DEFAULT '제출됨' NOT NULL,
	"created_at" text DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" text DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"grade" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"trend" text DEFAULT '0' NOT NULL,
	"risk" text DEFAULT '없음' NOT NULL,
	"color" text DEFAULT '#5368e8' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"email" text,
	"updated_at" text DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"provider_id" text,
	"password_hash" text,
	"password_salt" text,
	"student_id" text,
	"created_at" text DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
