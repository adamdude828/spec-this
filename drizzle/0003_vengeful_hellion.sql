CREATE TYPE "public"."provider_code" AS ENUM('github', 'azure_devops', 'gitlab', 'bitbucket');--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" "provider_code" NOT NULL,
	"base_url_pattern" text NOT NULL,
	"file_url_pattern" text NOT NULL,
	"line_url_pattern" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "provider_id" uuid;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;