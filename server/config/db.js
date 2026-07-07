const { Pool } = require('pg');
 
// PostgreSQL connection (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
 
// Surface any unexpected pool errors instead of crashing silently
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});
 
module.exports = pool;