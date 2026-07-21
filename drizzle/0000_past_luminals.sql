CREATE TABLE `academy_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`academy_name` text NOT NULL,
	`branch_name` text NOT NULL,
	`class_name` text NOT NULL,
	`teacher_name` text NOT NULL,
	`teacher_role` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`grade` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`trend` text DEFAULT '0' NOT NULL,
	`risk` text DEFAULT '없음' NOT NULL,
	`color` text DEFAULT '#5368e8' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
