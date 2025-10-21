-- Custom SQL migration file, put your code below! --

-- Create new enums for file changes
CREATE TYPE "public"."file_change_type" AS ENUM('create', 'modify', 'delete');--> statement-breakpoint
CREATE TYPE "public"."file_change_status" AS ENUM('planned', 'in_progress', 'completed', 'failed');--> statement-breakpoint

-- Create planned_file_changes table
CREATE TABLE "planned_file_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"change_type" "file_change_type" NOT NULL,
	"description" text,
	"expected_changes" text,
	"status" "file_change_status" DEFAULT 'planned' NOT NULL,
	"before_snapshot" text,
	"after_snapshot" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "planned_file_changes" ADD CONSTRAINT "planned_file_changes_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Drop tasks table (cascade will handle any constraints)
DROP TABLE IF EXISTS "tasks" CASCADE;--> statement-breakpoint

-- Drop task_status enum
DROP TYPE IF EXISTS "public"."task_status";
