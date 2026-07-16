import pg from 'pg';
import dotenv from 'dotenv';

// Force dotenv to load in case it hasn't run yet
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

// Debug log to pinpoint the problem
if (!connectionString) {
  console.warn('⚠️ WARNING: process.env.DATABASE_URL is undefined! pg will fall back to localhost:5432.');
} else {
  console.log('🔌 Found DATABASE_URL connection string, initializing connection...');
}

// Create the PostgreSQL connection pool (Supabase)
const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined
});

// Surface any unexpected pool errors instead of crashing silently
pool.on('error', (err: Error) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export default pool;