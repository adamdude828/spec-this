import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
let _db = null;
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
export const db = new Proxy({}, {
    get(_target, prop) {
        const database = initDb();
        return database[prop];
    }
});
// Export schema and types
export * from './schema.js';
