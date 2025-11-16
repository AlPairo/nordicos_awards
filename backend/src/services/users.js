const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');
const { mapUserRow } = require('../utils/mappers');

const USER_SELECT = 'id, username, email, role, is_active, created_at, updated_at';

const getHashRounds = () => parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

const findUserById = async (id) => {
  const { rows } = await query(`SELECT ${USER_SELECT} FROM users WHERE id = $1`, [id]);
  return rows[0] ? mapUserRow(rows[0]) : null;
};

const findUserWithPassword = async (identifier) => {
  const { rows } = await query(
    `SELECT ${USER_SELECT}, password_hash FROM users WHERE username = $1 OR email = $1 LIMIT 1`,
    [identifier]
  );
  if (!rows[0]) return null;
  return {
    ...mapUserRow(rows[0]),
    passwordHash: rows[0].password_hash
  };
};

const findUserByUsernameOrEmail = async ({ username, email }) => {
  const { rows } = await query(
    `SELECT ${USER_SELECT}
     FROM users
     WHERE username = $1 OR email = $2
     LIMIT 1`,
    [username, email]
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
};

const findUserSummaryById = async (id) => {
  const { rows } = await query(`SELECT ${USER_SELECT} FROM users WHERE id = $1`, [id]);
  return rows[0] ? mapUserRow(rows[0]) : null;
};

const createUser = async ({ username, email, password, role = 'user' }) => {
  const passwordHash = await bcrypt.hash(password, getHashRounds());
  const { rows } = await query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_SELECT}`,
    [username, email, passwordHash, role]
  );
  return mapUserRow(rows[0]);
};

const ensureAdminUser = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@nordicosawards.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const { rows } = await query(
    `SELECT id, password_hash FROM users WHERE username = $1 OR email = $2 LIMIT 1`,
    [username, email]
  );

  if (rows.length) {
    if (!rows[0].password_hash) {
      await query(`DELETE FROM users WHERE id = $1`, [rows[0].id]);
    } else {
      console.log('ℹ️  Admin user already exists');
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, getHashRounds());
  await query(
    `INSERT INTO users (username, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'admin', true)`,
    [username, email, passwordHash]
  );
  console.log('✅ Admin user ensured');
};

const deactivateUser = async (id) => {
  await query(`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`, [id]);
};

const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

module.exports = {
  findUserById,
  findUserSummaryById,
  findUserWithPassword,
  findUserByUsernameOrEmail,
  createUser,
  ensureAdminUser,
  deactivateUser,
  comparePassword
};
