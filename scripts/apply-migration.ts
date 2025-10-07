import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { db } from '../lib/db/index.js';

// Load environment variables
config({ path: '.env.local' });

async function applyMigration() {
  try {
    console.log('Creating repositories table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "repositories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "local_path" text NOT NULL,
        "repo_url" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log('Adding repo_id column to epics table...');
    await db.execute(sql`
      ALTER TABLE "epics" ADD COLUMN IF NOT EXISTS "repo_id" uuid;
    `);

    console.log('Adding foreign key constraint...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'epics_repo_id_repositories_id_fk'
        ) THEN
          ALTER TABLE "epics" ADD CONSTRAINT "epics_repo_id_repositories_id_fk"
          FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id")
          ON DELETE cascade ON UPDATE no action;
        END IF;
      END $$;
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
