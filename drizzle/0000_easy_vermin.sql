CREATE TYPE "public"."epic_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."story_status" AS ENUM('draft', 'ready', 'in_progress', 'review', 'completed');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'blocked', 'completed');--> statement-breakpoint
CREATE TABLE "epics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "epic_status" DEFAULT 'draft' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"epic_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"acceptance_criteria" text,
	"status" "story_status" DEFAULT 'draft' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"story_points" integer,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"estimated_hours" numeric(10, 2),
	"actual_hours" numeric(10, 2),
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_epic_id_epics_id_fk" FOREIGN KEY ("epic_id") REFERENCES "public"."epics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;