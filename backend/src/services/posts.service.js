const { query, transaction } = require('../data/db');
const { createHttpError } = require('../utils/httpError');

const allowedMediaTypes = ['image', 'video', 'text'];
const allowedFormats = ['vlog', 'photo', 'tip', 'debate'];
const allowedTags = new Set([
  'soleil',
  'plage',
  'roadtrip',
  'festival',
  'feuilles',
  'ville',
  'marche',
  'food',
  'neige',
  'montagne',
  'cocooning',
  'budget',
  'hanami',
  'nature',
  'culture',
  'slowtravel',
]);
const maxMediaSizeBytes = 50 * 1024 * 1024;
const pageSizeDefault = 8;
const pageSizeMax = 20;
const postAttemptsByUser = new Map();
const commentAttemptsByUser = new Map();
const feedCache = new Map();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalidateFeedCache() {
  feedCache.clear();
}

function assertNoSpam(bucket, userId, content, limit, windowMs) {
  const now = Date.now();
  const attempts = (bucket.get(userId) || []).filter((entry) => now - entry.at < windowMs);
  const normalized = content.trim().toLowerCase();

  if (attempts.length >= limit || attempts.some((entry) => entry.content === normalized)) {
    throw createHttpError(
      429,
      'spam_detected',
      'Action bloquee temporairement: contenu repetitif.',
    );
  }

  attempts.push({ at: now, content: normalized });
  bucket.set(userId, attempts);
}

function normalizeTags(tags = []) {
  const normalizedTags = [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()))].filter(
    Boolean,
  );

  if (normalizedTags.length > 8) {
    throw createHttpError(400, 'too_many_tags', 'Un post accepte 8 tags maximum.');
  }

  const invalidTag = normalizedTags.find((tag) => !allowedTags.has(tag));

  if (invalidTag) {
    throw createHttpError(400, 'invalid_tag', `Tag non autorise: ${invalidTag}.`);
  }

  return normalizedTags;
}

function validateMedia(payload) {
  if (!allowedMediaTypes.includes(payload.mediaType)) {
    throw createHttpError(400, 'invalid_media_type', 'Type media invalide.');
  }

  if (payload.mediaType !== 'text' && !payload.mediaUrl) {
    throw createHttpError(400, 'media_url_required', 'Une URL media est requise.');
  }

  if (payload.mediaSizeBytes && payload.mediaSizeBytes > maxMediaSizeBytes) {
    throw createHttpError(400, 'media_too_large', 'Media trop volumineux.', {
      maxMediaSizeBytes,
    });
  }
}

function assertUuid(value, field = 'id') {
  if (!uuidPattern.test(String(value))) {
    throw createHttpError(400, 'invalid_id', `${field} invalide.`);
  }
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function toCursor(post) {
  return Buffer.from(`${post.publishedAt}|${post.id}`).toString('base64url');
}

function fromCursor(cursor) {
  if (!cursor) {
    return null;
  }

  try {
    const [publishedAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');

    if (!publishedAt || !id) {
      throw new Error('Invalid cursor payload.');
    }

    return { publishedAt, id };
  } catch {
    throw createHttpError(400, 'invalid_cursor', 'Cursor invalide.');
  }
}

function toPost(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    author: row.author_username,
    title: row.title,
    caption: row.caption,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    mediaSizeBytes: row.media_size_bytes,
    format: row.format,
    location: row.location,
    season: row.season,
    status: row.status,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    sharesCount: row.shares_count,
    tags: row.tags || [],
    publishedAt: toIso(row.published_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    author: row.author_username,
    parentId: row.parent_id,
    content: row.content,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function postSelectSql() {
  return `
    SELECT
      posts.*,
      users.username AS author_username,
      COALESCE(
        ARRAY_AGG(tags.slug ORDER BY tags.slug) FILTER (WHERE tags.slug IS NOT NULL),
        '{}'
      ) AS tags
    FROM posts
    INNER JOIN users ON users.id = posts.author_id
    LEFT JOIN post_tags ON post_tags.post_id = posts.id
    LEFT JOIN tags ON tags.id = post_tags.tag_id
  `;
}

async function listFeed({ cursor, limit = pageSizeDefault, sort = 'recent' } = {}) {
  const safeLimit = Math.min(Number(limit) || pageSizeDefault, pageSizeMax);
  const safeSort = sort === 'trending' ? 'trending' : 'recent';
  const cacheKey = `${safeSort}:${cursor || 'first'}:${safeLimit}`;
  const cached = feedCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const cursorData = fromCursor(cursor);
  const params = [safeLimit + 1];
  const where = ["posts.status = 'published'"];

  if (cursorData && safeSort === 'recent') {
    params.push(cursorData.publishedAt, cursorData.id);
    where.push(
      `(posts.published_at < $2::timestamptz OR (posts.published_at = $2::timestamptz AND posts.id < $3::uuid))`,
    );
  }

  const orderBy =
    safeSort === 'trending'
      ? `((posts.likes_count * 2 + posts.comments_count * 3 + posts.shares_count)::numeric /
          GREATEST(EXTRACT(EPOCH FROM (now() - posts.published_at)) / 3600, 1)) DESC,
         posts.published_at DESC,
         posts.id DESC`
      : 'posts.published_at DESC, posts.id DESC';
  const result = await query(
    `${postSelectSql()}
     WHERE ${where.join(' AND ')}
     GROUP BY posts.id, users.username
     ORDER BY ${orderBy}
     LIMIT $1`,
    params,
  );
  const rows = result.rows.slice(0, safeLimit);
  const items = rows.map(toPost);
  const nextCursor = result.rows.length > safeLimit ? toCursor(items[items.length - 1]) : null;
  const payload = { items, nextCursor, sort: safeSort };

  feedCache.set(cacheKey, { payload, expiresAt: Date.now() + 20 * 1000 });
  return payload;
}

async function createPost(payload, user) {
  const caption = String(payload.caption || '').trim();

  if (caption.length < 2 || caption.length > 2200) {
    throw createHttpError(
      400,
      'invalid_caption',
      'La legende doit faire entre 2 et 2200 caracteres.',
    );
  }

  if (!allowedFormats.includes(payload.format)) {
    throw createHttpError(400, 'invalid_format', 'Format de post invalide.');
  }

  validateMedia(payload);
  assertNoSpam(postAttemptsByUser, user.id, caption, 6, 10 * 60 * 1000);

  const tags = normalizeTags(payload.tags);
  const post = await transaction(async (client) => {
    const postResult = await client.query(
      `INSERT INTO posts (
         author_id,
         title,
         caption,
         media_url,
         media_type,
         media_size_bytes,
         format,
         location,
         season,
         status,
         published_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', now())
       RETURNING *`,
      [
        user.id,
        payload.title || null,
        caption,
        payload.mediaUrl || null,
        payload.mediaType,
        Number(payload.mediaSizeBytes) || 0,
        payload.format,
        payload.location || null,
        payload.season || null,
      ],
    );
    const createdPost = postResult.rows[0];

    for (const tag of tags) {
      const tagResult = await client.query(
        `INSERT INTO tags (name, slug)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [tag, tag],
      );
      const tagId =
        tagResult.rows[0]?.id ||
        (
          await client.query(`SELECT id FROM tags WHERE lower(slug) = lower($1) LIMIT 1`, [tag])
        ).rows[0].id;

      await client.query(
        `INSERT INTO post_tags (post_id, tag_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [createdPost.id, tagId],
      );
    }

    const fullPostResult = await client.query(
      `${postSelectSql()}
       WHERE posts.id = $1
       GROUP BY posts.id, users.username`,
      [createdPost.id],
    );

    return toPost(fullPostResult.rows[0]);
  });

  invalidateFeedCache();
  return post;
}

async function getPost(postId) {
  assertUuid(postId, 'postId');

  const result = await query(
    `${postSelectSql()}
     WHERE posts.id = $1
     GROUP BY posts.id, users.username`,
    [postId],
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, 'post_not_found', 'Post introuvable.');
  }

  return toPost(result.rows[0]);
}

async function listComments(postId) {
  await getPost(postId);

  const result = await query(
    `SELECT comments.*, users.username AS author_username
     FROM comments
     INNER JOIN users ON users.id = comments.author_id
     WHERE comments.post_id = $1 AND comments.status = 'published'
     ORDER BY comments.created_at ASC`,
    [postId],
  );

  return result.rows.map(toComment);
}

async function addComment(postId, payload, user) {
  await getPost(postId);

  const content = String(payload.content || '').trim();

  if (content.length < 2 || content.length > 800) {
    throw createHttpError(
      400,
      'invalid_comment',
      'Le commentaire doit faire entre 2 et 800 caracteres.',
    );
  }

  assertNoSpam(commentAttemptsByUser, user.id, content, 10, 10 * 60 * 1000);

  const result = await query(
    `INSERT INTO comments (post_id, author_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [postId, user.id, content],
  );
  const comment = toComment({
    ...result.rows[0],
    author_username: user.username,
  });

  invalidateFeedCache();
  return comment;
}

async function toggleLike(postId, user) {
  await getPost(postId);

  const deleted = await query(
    `DELETE FROM likes
     WHERE user_id = $1 AND post_id = $2
     RETURNING id`,
    [user.id, postId],
  );
  const liked = deleted.rowCount === 0;

  if (liked) {
    await query(
      `INSERT INTO likes (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [user.id, postId],
    );
  }

  const postResult = await query(`SELECT likes_count FROM posts WHERE id = $1`, [postId]);

  invalidateFeedCache();
  return { liked, likesCount: postResult.rows[0].likes_count };
}

async function sharePost(postId, user = null) {
  await getPost(postId);

  const result = await query(
    `INSERT INTO post_shares (post_id, user_id)
     VALUES ($1, $2)
     RETURNING id`,
    [postId, user?.id || null],
  );
  const postResult = await query(`SELECT shares_count FROM posts WHERE id = $1`, [postId]);

  invalidateFeedCache();
  return { shareId: result.rows[0].id, sharesCount: postResult.rows[0].shares_count };
}

const postsService = {
  addComment,
  createPost,
  getPost,
  listComments,
  listFeed,
  sharePost,
  toggleLike,
};

module.exports = {
  postsService,
};
