/* eslint-disable no-console */
import { config } from 'dotenv';
import { db } from '../lib/db/index.js';
import { epics, repositories } from '../lib/db/schema.js';

config({ path: '.env.local' });

async function checkData() {
  try {
    const allEpics = await db.select().from(epics);
    const allRepos = await db.select().from(repositories);

    console.log('Repositories:', allRepos.length);
    console.log('Epics:', allEpics.length);
    console.log('\nEpics without repoId:', allEpics.filter(e => !e.repoId).length);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
