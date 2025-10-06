import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let _db: PostgresJsDatabase<typeof schema> | null = null;

function initDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const client = postgres(process.env.DATABASE_URL);
    _db = drizzle(client, { schema });
  }
  return _db;
}

// Lazy-loaded database instance
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const database = initDb();
    return database[prop as keyof PostgresJsDatabase<typeof schema>];
  }
});

// Export schema and types
export * from './schema';
