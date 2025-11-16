const buildUserSummary = (prefix, row) => {
  const idKey = `${prefix}_id`;
  const usernameKey = `${prefix}_username`;
  const emailKey = `${prefix}_email`;

  if (!row || !row[idKey]) {
    return null;
  }

  return {
    id: row[idKey],
    username: row[usernameKey] || null,
    email: row[emailKey] || null
  };
};

const mapUserRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    is_active: row.is_active,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
};

const mapCategoryRow = (row) => {
  if (!row) return null;
  const createdBy = buildUserSummary('created_by', row);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    is_active: row.is_active,
    maxNominees: row.max_nominees,
    max_nominees: row.max_nominees,
    allowMultipleVotes: row.allow_multiple_votes,
    allow_multiple_votes: row.allow_multiple_votes,
    votingEnabled: row.voting_enabled,
    voting_enabled: row.voting_enabled,
    order: row.display_order,
    year: row.year,
    display_order: row.display_order,
    createdBy,
    created_by: createdBy,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
};

const mapNomineeRow = (row) => {
  if (!row) return null;
  const linkedMedia = row.linked_media_id
    ? {
        id: row.linked_media_id,
        filename: row.linked_media_filename,
        file_path: row.linked_media_file_path,
        media_type: row.linked_media_media_type,
        file_url: row.linked_media_file_path
      }
    : null;
  const createdBy = buildUserSummary('nominee_created_by', row) || buildUserSummary('created_by', row);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category_id,
    category_id: row.category_id,
    imageUrl: row.image_url,
    image_url: row.image_url,
    videoUrl: row.video_url,
    video_url: row.video_url,
    mediaType: row.media_type,
    media_type: row.media_type,
    isActive: row.is_active,
    is_active: row.is_active,
    order: row.display_order,
    display_order: row.display_order,
    metadata: row.original_filename || row.file_size || row.mime_type || row.uploaded_at
      ? {
          originalFilename: row.original_filename,
          fileSize: row.file_size,
          mimeType: row.mime_type,
          uploadedAt: row.uploaded_at
        }
      : undefined,
    linked_media: linkedMedia,
    createdBy,
    created_by: createdBy,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
};

const mapMediaRow = (row) => {
  if (!row) return null;
  const user = buildUserSummary('u', row);
  const reviewer = buildUserSummary('reviewer', row);
  return {
    id: row.id,
    user_id: row.user_id,
    filename: row.filename,
    original_filename: row.original_filename,
    file_path: row.file_path,
    media_type: row.media_type,
    file_size: row.file_size,
    status: row.status,
    description: row.description,
    admin_notes: row.admin_notes,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    user,
    reviewer,
    file_url: row.file_path
  };
};

const mapVoteRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    user: buildUserSummary('user', row),
    category: row.category
      ? {
          id: row.category_id || row.category,
          name: row.category_name || null,
          description: row.category_description || null
        }
      : buildUserSummary('category', row),
    nominee: row.nominee
      ? {
          id: row.nominee_id || row.nominee,
          name: row.nominee_name || null,
          description: row.nominee_description || null
        }
      : buildUserSummary('nominee', row),
    categoryId: row.category_id,
    nomineeId: row.nominee_id,
    userId: row.user_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at
  };
};

module.exports = {
  buildUserSummary,
  mapUserRow,
  mapCategoryRow,
  mapNomineeRow,
  mapMediaRow,
  mapVoteRow
};
