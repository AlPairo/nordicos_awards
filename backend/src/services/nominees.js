const { query } = require('../db/pool');
const { mapNomineeRow } = require('../utils/mappers');

const listNominees = async ({ categoryId, onlyActive = true } = {}) => {
  const params = [];
  const clauses = [];

  if (categoryId) {
    params.push(categoryId);
    clauses.push(`n.category_id = $${params.length}`);
  }

  if (onlyActive) {
    params.push(true);
    clauses.push(`n.is_active = $${params.length}`);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT n.id, n.name, n.description, n.category_id, n.image_url, n.video_url, n.media_type,
            n.is_active, n.display_order, n.original_filename, n.file_size, n.mime_type, n.uploaded_at,
            n.linked_media_id,
            mu.filename AS linked_media_filename,
            mu.file_path AS linked_media_file_path,
            mu.media_type AS linked_media_media_type,
            n.created_by AS nominee_created_by_id,
            u.username AS nominee_created_by_username,
            u.email AS nominee_created_by_email,
            n.created_at, n.updated_at,
            COALESCE(vc.vote_count, 0) AS vote_count
     FROM nominees n
     LEFT JOIN users u ON u.id = n.created_by
     LEFT JOIN media_uploads mu ON mu.id = n.linked_media_id
     LEFT JOIN (
       SELECT nominee_id, COUNT(*) AS vote_count
       FROM votes
       GROUP BY nominee_id
     ) vc ON vc.nominee_id = n.id
     ${whereClause}
     ORDER BY n.display_order ASC, n.created_at ASC`,
    params
  );

  return rows.map((row) => {
    const votes = Number(row.vote_count || 0);
    return {
      ...mapNomineeRow(row),
      vote_count: votes,
      voteCount: votes
    };
  });
};

const getNomineeById = async (id) => {
  const { rows } = await query(
    `SELECT n.id, n.name, n.description, n.category_id, n.image_url, n.video_url, n.media_type,
            n.is_active, n.display_order, n.original_filename, n.file_size, n.mime_type, n.uploaded_at,
            n.linked_media_id,
            mu.filename AS linked_media_filename,
            mu.file_path AS linked_media_file_path,
            mu.media_type AS linked_media_media_type,
            n.created_by AS nominee_created_by_id,
            u.username AS nominee_created_by_username,
            u.email AS nominee_created_by_email,
            n.created_at, n.updated_at,
            COALESCE(vc.vote_count, 0) AS vote_count,
            c.name AS category_name,
            c.description AS category_description
     FROM nominees n
     LEFT JOIN users u ON u.id = n.created_by
     LEFT JOIN categories c ON c.id = n.category_id
     LEFT JOIN media_uploads mu ON mu.id = n.linked_media_id
     LEFT JOIN (
       SELECT nominee_id, COUNT(*) AS vote_count
       FROM votes
       GROUP BY nominee_id
     ) vc ON vc.nominee_id = n.id
     WHERE n.id = $1`,
    [id]
  );

  if (!rows[0]) return null;
  const votes = Number(rows[0].vote_count || 0);
  return {
    ...mapNomineeRow(rows[0]),
    vote_count: votes,
    voteCount: votes,
    category: rows[0].category_id,
    categoryName: rows[0].category_name,
    categoryDescription: rows[0].category_description
  };
};

const createNominee = async (data) => {
  const {
    name,
    description = null,
    category,
    imageUrl = null,
    videoUrl = null,
    mediaType = 'none',
    order = 0,
    createdBy,
    linkedMedia = null,
    metadata = {}
  } = data;

  const { rows } = await query(
    `INSERT INTO nominees (name, description, category_id, image_url, video_url, media_type, is_active, display_order,
                           original_filename, file_size, mime_type, uploaded_at, linked_media_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id`,
    [
      name,
      description,
      category,
      imageUrl,
      videoUrl,
      mediaType,
      order,
      metadata.originalFilename || null,
      metadata.fileSize || null,
      metadata.mimeType || null,
      metadata.uploadedAt || null,
      linkedMedia,
      createdBy
    ]
  );

  return rows[0].id;
};

const updateNominee = async (id, data) => {
  const entries = {
    name: data.name,
    description: data.description,
    category_id: data.category,
    image_url: data.imageUrl,
    video_url: data.videoUrl,
    media_type: data.mediaType,
    is_active: data.isActive,
    display_order: data.order,
    original_filename: data.metadata?.originalFilename,
    file_size: data.metadata?.fileSize,
    mime_type: data.metadata?.mimeType,
    uploaded_at: data.metadata?.uploadedAt,
    linked_media_id: data.linked_media
  };

  const fields = [];
  const params = [];

  Object.entries(entries).forEach(([column, value]) => {
    if (typeof value !== 'undefined') {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  });

  if (!fields.length) return;

  params.push(id);
  await query(`UPDATE nominees SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
};

const deleteNominee = async (id) => {
  await query('DELETE FROM votes WHERE nominee_id = $1', [id]);
  await query('DELETE FROM nominees WHERE id = $1', [id]);
};

const countNominees = async (categoryId) => {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM nominees WHERE category_id = $1 AND is_active = true', [categoryId]);
  return rows[0]?.count || 0;
};

module.exports = {
  listNominees,
  getNomineeById,
  createNominee,
  updateNominee,
  deleteNominee,
  countNominees
};
