const { query } = require('../db/pool');
const { mapVoteRow } = require('../utils/mappers');

const createVote = async ({ userId, categoryId, nomineeId, ipAddress, userAgent }) => {
  const { rows } = await query(
    `INSERT INTO votes (user_id, category_id, nominee_id, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, category_id, nominee_id, ip_address, user_agent, created_at`,
    [userId, categoryId, nomineeId, ipAddress, userAgent]
  );
  return rows[0];
};

const getVotesByUser = async (userId) => {
  const { rows } = await query(
    `SELECT v.id, v.user_id, v.category_id, v.nominee_id, v.ip_address, v.user_agent, v.created_at,
            c.name AS category_name, c.description AS category_description,
            n.name AS nominee_name, n.description AS nominee_description
     FROM votes v
     LEFT JOIN categories c ON c.id = v.category_id
     LEFT JOIN nominees n ON n.id = v.nominee_id
     WHERE v.user_id = $1
     ORDER BY v.created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    nominee_id: row.nominee_id,
    category: {
      id: row.category_id,
      name: row.category_name,
      description: row.category_description
    },
    nominee: {
      id: row.nominee_id,
      name: row.nominee_name,
      description: row.nominee_description
    },
    ipAddress: row.ip_address,
    ip_address: row.ip_address,
    userAgent: row.user_agent,
    user_agent: row.user_agent,
    createdAt: row.created_at,
    created_at: row.created_at
  }));
};

const getResults = async ({ categoryId } = {}) => {
  const params = [];
  const whereClause = categoryId ? (params.push(categoryId), `WHERE v.category_id = $1`) : '';

  const { rows } = await query(
    `SELECT c.id AS category_id, c.name AS category_name, c.description AS category_description,
            n.id AS nominee_id, n.name AS nominee_name, n.description AS nominee_description,
            COUNT(v.id)::int AS vote_count
     FROM votes v
     LEFT JOIN categories c ON c.id = v.category_id
     LEFT JOIN nominees n ON n.id = v.nominee_id
     ${whereClause}
     GROUP BY c.id, n.id
     ORDER BY c.name, vote_count DESC`,
    params
  );

  const resultMap = new Map();
  rows.forEach((row) => {
    if (!resultMap.has(row.category_id)) {
      resultMap.set(row.category_id, {
        _id: row.category_id,
        categoryName: row.category_name,
        categoryDescription: row.category_description,
        totalVotes: 0,
        nominees: []
      });
    }
    const category = resultMap.get(row.category_id);
    category.nominees.push({
      id: row.nominee_id,
      name: row.nominee_name,
      description: row.nominee_description,
      voteCount: row.vote_count,
      voterCount: row.vote_count
    });
    category.totalVotes += row.vote_count;
  });

  return Array.from(resultMap.values());
};

const deleteVoteForUserAndCategory = async ({ userId, categoryId }) => {
  const { rows } = await query(
    `DELETE FROM votes
     WHERE user_id = $1 AND category_id = $2
     RETURNING id`,
    [userId, categoryId]
  );
  return rows[0] || null;
};

const getVoteForUserAndCategory = async ({ userId, categoryId }) => {
  const { rows } = await query(
    `SELECT id FROM votes WHERE user_id = $1 AND category_id = $2 LIMIT 1`,
    [userId, categoryId]
  );
  return rows[0] || null;
};

const deleteVoteById = async ({ userId, voteId }) => {
  const { rows } = await query(
    `DELETE FROM votes
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [voteId, userId]
  );
  return rows[0] || null;
};

module.exports = {
  createVote,
  getVotesByUser,
  getResults,
  deleteVoteForUserAndCategory,
  getVoteForUserAndCategory,
  deleteVoteById
};
