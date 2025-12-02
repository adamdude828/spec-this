-- Add quick tasks functionality

-- Create quick_task_status enum
CREATE TYPE "public"."quick_task_status" AS ENUM('planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint

-- Create quick_tasks table
CREATE TABLE "quick_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "quick_task_status" DEFAULT 'planned' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);--> statement-breakpoint

-- Add foreign key constraint for quick_tasks
ALTER TABLE "quick_tasks" ADD CONSTRAINT "quick_tasks_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Modify planned_file_changes to support both stories and quick tasks
-- First, make story_id nullable
ALTER TABLE "planned_file_changes" ALTER COLUMN "story_id" DROP NOT NULL;--> statement-breakpoint

-- Add quick_task_id column
ALTER TABLE "planned_file_changes" ADD COLUMN "quick_task_id" uuid;--> statement-breakpoint

-- Add foreign key constraint for quick_task_id
ALTER TABLE "planned_file_changes" ADD CONSTRAINT "planned_file_changes_quick_task_id_quick_tasks_id_fk" FOREIGN KEY ("quick_task_id") REFERENCES "public"."quick_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Add check constraint to ensure either story_id or quick_task_id is set (but not both)
ALTER TABLE "planned_file_changes" ADD CONSTRAINT "planned_file_changes_parent_check" CHECK (
	(story_id IS NOT NULL AND quick_task_id IS NULL) OR
	(story_id IS NULL AND quick_task_id IS NOT NULL)
);--> statement-breakpoint
