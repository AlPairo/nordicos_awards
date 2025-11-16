const { query } = require('../db/pool');
const { mapCategoryRow, mapNomineeRow } = require('../utils/mappers');

const buildCategoryFilter = (activeOnly) => {
  const clauses = [];
  const params = [];
  if (activeOnly === true) {
    params.push(true);
    clauses.push(`c.is_active = $${params.length}`);
  }
  return { clauses, params };
};

const fetchCategories = async ({ activeOnly } = {}) => {
  const { clauses, params } = buildCategoryFilter(activeOnly);
  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const categoriesRes = await query(
    `SELECT c.id, c.name, c.description, c.is_active, c.max_nominees, c.allow_multiple_votes,
            c.voting_enabled, c.display_order, c.year, c.created_at, c.updated_at,
            c.created_by as created_by_id, u.username AS created_by_username, u.email AS created_by_email
     FROM categories c
     LEFT JOIN users u ON u.id = c.created_by
     ${whereClause}
     ORDER BY c.display_order ASC, c.created_at ASC`,
    params
  );

  const mapped = categoriesRes.rows.map(mapCategoryRow);
  console.log('[services/categories] fetched categories:', mapped.length);
  return mapped;
};

const fetchCategoriesWithNominees = async ({ activeOnly } = {}) => {
  const categories = await fetchCategories({ activeOnly });
  if (!categories.length) return [];

  const categoryIds = categories.map((c) => c.id);
  const nomineesRes = await query(
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
     WHERE n.category_id = ANY($1::uuid[])
       AND n.is_active = true
     ORDER BY n.display_order ASC, n.created_at ASC`,
    [categoryIds]
  );

  const nomineesByCategory = categoryIds.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {});

  nomineesRes.rows.forEach((row) => {
    const nominee = mapNomineeRow(row);
    const votes = Number(row.vote_count || 0);
    nomineesByCategory[row.category_id]?.push({
      ...nominee,
      vote_count: votes,
      voteCount: votes
    });
  });

  const result = categories.map((category) => ({
    ...category,
    nominees: nomineesByCategory[category.id] || []
  }));
  console.log('[services/categories] categories with nominees:', result.length);
  return result;
};

const getCategoryById = async (id) => {
  const { rows } = await query(
    `SELECT c.id, c.name, c.description, c.is_active, c.max_nominees, c.allow_multiple_votes,
            c.voting_enabled, c.display_order, c.year, c.created_at, c.updated_at,
            c.created_by as created_by_id, u.username AS created_by_username, u.email AS created_by_email
     FROM categories c
     LEFT JOIN users u ON u.id = c.created_by
     WHERE c.id = $1`,
    [id]
  );
  const mapped = rows[0] ? mapCategoryRow(rows[0]) : null;
  if (mapped) {
    console.log('[services/categories] getCategoryById found:', mapped.id, 'year:', mapped.year);
  }
  return mapped;
};

const getCategoryWithNominees = async (id) => {
  const category = await getCategoryById(id);
  if (!category) return null;

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
     WHERE n.category_id = $1 AND n.is_active = true
     ORDER BY n.display_order ASC, n.created_at ASC`,
    [id]
  );

  const payload = {
    ...category,
    nominees: rows.map((row) => {
      const votes = Number(row.vote_count || 0);
      return {
        ...mapNomineeRow(row),
        vote_count: votes,
        voteCount: votes
      };
    })
  };
  console.log('[services/categories] getCategoryWithNominees:', payload.id, 'nominees:', payload.nominees.length);
  return payload;
};

const createCategory = async (data) => {
  const {
    name,
    description = null,
    isActive,
    is_active,
    order = 0,
    maxNominees = 10,
    allowMultipleVotes = false,
    votingEnabled = true,
    year,
    createdBy
  } = data;

  const isActiveValue = typeof isActive !== 'undefined' ? isActive : (typeof is_active !== 'undefined' ? is_active : true);
  const yearValue = typeof year !== 'undefined' ? year : new Date().getFullYear();

  const { rows } = await query(
    `INSERT INTO categories (name, description, is_active, display_order, max_nominees, allow_multiple_votes, voting_enabled, year, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [name, description, isActiveValue, order, maxNominees, allowMultipleVotes, votingEnabled, yearValue, createdBy]
  );

  const created = await getCategoryById(rows[0].id);
  console.log('[services/categories] createCategory stored:', created?.id, 'year:', created?.year);
  return created;
};

const updateCategory = async (id, data) => {
  const fields = [];
  const params = [];
  const entries = {
    name: data.name,
    description: data.description,
    is_active: typeof data.isActive !== 'undefined' ? data.isActive : data.is_active,
    display_order: data.order,
    max_nominees: data.maxNominees,
    allow_multiple_votes: data.allowMultipleVotes,
    voting_enabled: data.votingEnabled,
    year: data.year
  };

  Object.entries(entries).forEach(([column, value]) => {
    if (typeof value !== 'undefined') {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  });

  if (!fields.length) {
    return getCategoryById(id);
  }

  params.push(id);
  await query(`UPDATE categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
  const updated = await getCategoryById(id);
  console.log('[services/categories] updateCategory stored:', updated?.id, 'year:', updated?.year);
  return updated;
};

const deleteCategory = async (id) => {
  await query('DELETE FROM categories WHERE id = $1', [id]);
};

const countNomineesInCategory = async (categoryId) => {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM nominees WHERE category_id = $1 AND is_active = true', [categoryId]);
  const count = rows[0]?.count || 0;
  console.log('[services/categories] countNomineesInCategory:', categoryId, count);
  return count;
};

module.exports = {
  fetchCategoriesWithNominees,
  getCategoryById,
  getCategoryWithNominees,
  createCategory,
  updateCategory,
  deleteCategory,
  countNomineesInCategory
};
