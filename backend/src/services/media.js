const { query } = require('../db/pool');
const { mapMediaRow } = require('../utils/mappers');

const createMediaUpload = async ({
  userId,
  filename,
  originalFilename,
  filePath,
  mediaType,
  fileSize,
  description = ''
}) => {
  const { rows } = await query(
    `INSERT INTO media_uploads (user_id, filename, original_filename, file_path, media_type, file_size, description, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING *`,
    [userId, filename, originalFilename, filePath, mediaType, fileSize, description]
  );
  return mapMediaRow(rows[0]);
};

const findMediaById = async (id) => {
  const { rows } = await query(
    `SELECT mu.*, u.id AS u_id, u.username AS u_username, u.email AS u_email,
            reviewer.id AS reviewer_id, reviewer.username AS reviewer_username, reviewer.email AS reviewer_email
     FROM media_uploads mu
     LEFT JOIN users u ON u.id = mu.user_id
     LEFT JOIN users reviewer ON reviewer.id = mu.reviewed_by
     WHERE mu.id = $1`,
    [id]
  );
  return rows[0] ? mapMediaRow(rows[0]) : null;
};

const updateMediaStatus = async ({ mediaId, status, adminNotes, reviewerId }) => {
  const { rows } = await query(
    `UPDATE media_uploads
     SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [status, adminNotes || '', reviewerId, mediaId]
  );
  return rows[0] ? mapMediaRow(rows[0]) : null;
};

const listPendingMedia = async () => {
  const { rows } = await query(
    `SELECT mu.*, u.id AS u_id, u.username AS u_username, u.email AS u_email
     FROM media_uploads mu
     LEFT JOIN users u ON u.id = mu.user_id
     WHERE mu.status = 'pending'
     ORDER BY mu.created_at DESC`
  );
  return rows.map(mapMediaRow);
};

const listMediaForUser = async (userId) => {
  const { rows } = await query(
    `SELECT mu.*, u.id AS u_id, u.username AS u_username, u.email AS u_email,
            reviewer.id AS reviewer_id, reviewer.username AS reviewer_username, reviewer.email AS reviewer_email
     FROM media_uploads mu
     LEFT JOIN users u ON u.id = mu.user_id
     LEFT JOIN users reviewer ON reviewer.id = mu.reviewed_by
     WHERE mu.user_id = $1
     ORDER BY mu.created_at DESC`,
    [userId]
  );
  return rows.map(mapMediaRow);
};

const listMedia = async ({ status, isAdmin, userId }) => {
  const clauses = [];
  const params = [];

  if (!isAdmin) {
    params.push(userId);
    clauses.push(`mu.user_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    clauses.push(`mu.status = $${params.length}`);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT mu.*, u.id AS u_id, u.username AS u_username, u.email AS u_email,
            reviewer.id AS reviewer_id, reviewer.username AS reviewer_username, reviewer.email AS reviewer_email
     FROM media_uploads mu
     LEFT JOIN users u ON u.id = mu.user_id
     LEFT JOIN users reviewer ON reviewer.id = mu.reviewed_by
     ${whereClause}
     ORDER BY mu.created_at DESC`,
    params
  );
  return rows.map(mapMediaRow);
};

const deleteMedia = async (id) => {
  await query('DELETE FROM media_uploads WHERE id = $1', [id]);
};

const deleteMediaAsAdmin = async ({ mediaId, deletedBy }) => {
  const { rows } = await query(
    `DELETE FROM media_uploads
     WHERE id = $1
     RETURNING id, filename, original_filename, file_path, user_id`,
    [mediaId]
  );
  if (!rows[0]) return null;
  console.log('[services/media] Admin delete:', deletedBy, 'removed media:', mediaId);
  return rows[0];
};

module.exports = {
  createMediaUpload,
  findMediaById,
  updateMediaStatus,
  listPendingMedia,
  listMediaForUser,
  listMedia,
  deleteMedia,
  deleteMediaAsAdmin
};
