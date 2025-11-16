const { Pool } = require('pg');

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Database connection string missing. Set SUPABASE_DB_URL or DATABASE_URL.');
}

const pool = new Pool({
  connectionString,
  ssl: {
    require: false,
    rejectUnauthorized: true, // ⚠️ solo para desarrollo
  },
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
