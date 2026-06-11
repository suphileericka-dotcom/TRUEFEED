// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const { query: dbQuery } = require('../data/db');

const supportedTypes = new Set(['all', 'destination', 'tag', 'user', 'post']);

function getSafeLimit(limit) {
  return Math.min(Number(limit) || 8, 20);
}

function normalizeType(type) {
  return supportedTypes.has(type) ? type : 'all';
}

function toPost(row) {
  return {
    id: row.id,
    type: 'post',
    authorId: row.author_id,
    author: row.author_username,
    title: row.title,
    caption: row.caption,
    location: row.location,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    format: row.format,
    tags: row.tags || [],
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    sharesCount: row.shares_count,
    publishedAt: row.published_at instanceof Date ? row.published_at.toISOString() : row.published_at,
  };
}

async function searchPosts(textQuery, plainQuery, limit) {
  const result = await dbQuery(
    `SELECT
       posts.*,
       users.username AS author_username,
       COALESCE(
         ARRAY_AGG(tags.slug ORDER BY tags.slug) FILTER (WHERE tags.slug IS NOT NULL),
         '{}'
       ) AS tags,
       ts_rank(posts.search_vector, plainto_tsquery('simple', $1)) AS rank
     FROM posts
     INNER JOIN users ON users.id = posts.author_id
     LEFT JOIN post_tags ON post_tags.post_id = posts.id
     LEFT JOIN tags ON tags.id = post_tags.tag_id
     WHERE posts.status = 'published'
       AND (
         posts.search_vector @@ plainto_tsquery('simple', $1)
         OR lower(posts.location) LIKE $2
         OR lower(tags.slug) LIKE $2
       )
     GROUP BY posts.id, users.username
     ORDER BY rank DESC, posts.published_at DESC
     LIMIT $3`,
    [textQuery, `%${plainQuery}%`, limit],
  );

  return result.rows.map(toPost);
}

async function searchTags(plainQuery, limit) {
  const result = await dbQuery(
    `SELECT id, slug AS name
     FROM tags
     WHERE lower(name) LIKE $1 OR lower(slug) LIKE $1
     ORDER BY slug ASC
     LIMIT $2`,
    [`%${plainQuery}%`, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: 'tag',
    name: row.name,
  }));
}

async function searchUsers(plainQuery, limit) {
  const result = await dbQuery(
    `SELECT id, username, display_name
     FROM users
     WHERE status = 'active'
       AND (lower(username) LIKE $1 OR lower(display_name) LIKE $1)
     ORDER BY username ASC
     LIMIT $2`,
    [`%${plainQuery}%`, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: 'user',
    username: row.username,
    displayName: row.display_name,
  }));
}

async function searchDestinations(plainQuery, limit) {
  const result = await dbQuery(
    `SELECT id, name, category, city, score, tags
     FROM places
     WHERE lower(name) LIKE $1
       OR lower(category) LIKE $1
       OR lower(city) LIKE $1
       OR EXISTS (
         SELECT 1
         FROM unnest(tags) AS tag
         WHERE lower(tag) LIKE $1
       )
     ORDER BY score DESC, name ASC
     LIMIT $2`,
    [`%${plainQuery}%`, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: 'destination',
    name: row.name,
    category: row.category,
    city: row.city,
    score: Number(row.score),
    tags: row.tags || [],
  }));
}

async function search({ q = '', type = 'all', limit = 8 }) {
  const textQuery = String(q).trim();
  const plainQuery = textQuery.toLowerCase();
  const safeLimit = getSafeLimit(limit);
  const safeType = normalizeType(type);

  if (!plainQuery) {
    return { query: plainQuery, type: safeType, items: [] };
  }

  const pools = {};

  if (safeType === 'all' || safeType === 'destination') {
    pools.destination = await searchDestinations(plainQuery, safeLimit);
  }

  if (safeType === 'all' || safeType === 'tag') {
    pools.tag = await searchTags(plainQuery, safeLimit);
  }

  if (safeType === 'all' || safeType === 'user') {
    pools.user = await searchUsers(plainQuery, safeLimit);
  }

  if (safeType === 'all' || safeType === 'post') {
    pools.post = await searchPosts(textQuery, plainQuery, safeLimit);
  }

  const items =
    safeType === 'all'
      ? [
          ...(pools.destination || []),
          ...(pools.tag || []),
          ...(pools.user || []),
          ...(pools.post || []),
        ]
      : pools[safeType] || [];

  return {
    query: plainQuery,
    type: safeType,
    items: items.slice(0, safeLimit),
  };
}

module.exports = {
  searchService: {
    search,
  },
};
