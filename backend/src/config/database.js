const { pool } = require('../db/pool');
const { ensureAdminUser } = require('../services/users');

const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Supabase Postgres connected');
    await ensureAdminUser();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await pool.end();
    console.log('🔌 Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
