import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema.js';

const { Pool } = pg;

const rawUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error('NEON_DATABASE_URL must be set.');
}

// Strip channel_binding param — node-postgres does not support it and it
// causes queries to fail with a "Failed query" error at runtime.
const connectionString = rawUrl.replace(/[?&]channel_binding=[^&]*/g, (m) =>
  m.startsWith('?') ? '?' : ''
).replace(/\?$/, '');

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
