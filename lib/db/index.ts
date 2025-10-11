import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { shutdownHandler } from '../shutdown-handler.ts';

let _db: PostgresJsDatabase<typeof schema> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function initDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _client = postgres(process.env.DATABASE_URL, {
      // Set connection pool limits for better resource management
      max: 10, // Maximum number of connections
      idle_timeout: 20, // Close idle connections after 20 seconds
      max_lifetime: 60 * 30, // Close connections after 30 minutes
    });
    _db = drizzle(_client, { schema });
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

// Register cleanup function with shutdown handler
shutdownHandler.register(async () => {
  if (_client) {
    await _client.end({ timeout: 5 });
    _client = null;
    _db = null;
  }
});

// Export schema and types
export * from './schema.ts';
