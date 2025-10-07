import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { db } from '../lib/db/index.js';
import { epics, repositories } from '../lib/db/schema.js';

config({ path: '.env.local' });

async function migrateExistingData() {
  try {
    console.log('Checking for existing epics...');
    const allEpics = await db.select().from(epics);
    const epicsWithoutRepo = allEpics.filter(e => !e.repoId);

    if (epicsWithoutRepo.length === 0) {
      console.log('All epics already have a repository. Migration complete.');
      process.exit(0);
    }

    console.log(`Found ${epicsWithoutRepo.length} epics without a repository.`);

    // Create a default repository
    console.log('Creating default repository...');
    const [defaultRepo] = await db.insert(repositories).values({
      name: 'Default Repository',
      localPath: process.cwd(),
      repoUrl: null,
    }).returning();

    console.log(`Created default repository: ${defaultRepo.id}`);

    // Update all epics without a repoId to use the default repository
    console.log('Assigning epics to default repository...');
    await db.execute(sql`
      UPDATE epics
      SET repo_id = ${defaultRepo.id}
      WHERE repo_id IS NULL
    `);

    console.log(`Updated ${epicsWithoutRepo.length} epics.`);

    // Now make the repo_id column NOT NULL
    console.log('Making repo_id column NOT NULL...');
    await db.execute(sql`
      ALTER TABLE epics ALTER COLUMN repo_id SET NOT NULL
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateExistingData();
