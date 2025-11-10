-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create URLs table with vector support
CREATE TABLE IF NOT EXISTS "urls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL UNIQUE,
	"title" text,
	"content" text,
	"summary" text,
	"embedding" vector(1536),
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create index on embedding column for faster similarity searches
CREATE INDEX IF NOT EXISTS "urls_embedding_idx" ON "urls" USING ivfflat ("embedding" vector_cosine_ops);

-- Create index on tags for faster tag filtering
CREATE INDEX IF NOT EXISTS "urls_tags_idx" ON "urls" USING gin ("tags");

-- Create index on URL for faster lookups
CREATE INDEX IF NOT EXISTS "urls_url_idx" ON "urls" ("url");
