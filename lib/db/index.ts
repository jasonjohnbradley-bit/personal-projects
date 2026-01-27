import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let db: NodePgDatabase<typeof schema> | null = null;

export function getDb() {
  if (!db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    db = drizzle(pool, { schema });
  }
  return db;
}
