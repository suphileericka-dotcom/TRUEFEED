const { query, transaction } = require('../data/db');
const { createHttpError } = require('../utils/httpError');

function toStory(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    author: row.author_username,
    authorName: row.author_display_name,
    text: row.text,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    durationMs: row.duration_ms,
    backgroundColor: row.background_color,
    viewsCount: Number(row.views_count || 0),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function toViewer(row) {
  return {
    id: row.viewer_id,
    username: row.viewer_username,
    displayName: row.viewer_display_name,
    viewedAt: row.viewed_at,
    online: Boolean(row.online),
    lastSeenAt: row.viewer_last_seen_at,
  };
}

async function listStories({ limit = 30 } = {}) {
  const safeLimit = Math.min(Number(limit) || 30, 60);
  const result = await query(
    `SELECT stories.*,
            users.username AS author_username,
            users.display_name AS author_display_name,
            COUNT(story_views.viewer_id)::INTEGER AS views_count
     FROM stories
     INNER JOIN users ON users.id = stories.author_id
     LEFT JOIN story_views ON story_views.story_id = stories.id
     WHERE stories.status = 'published'
       AND stories.expires_at > now()
     GROUP BY stories.id, users.username, users.display_name
     ORDER BY stories.created_at DESC
     LIMIT $1`,
    [safeLimit],
  );

  return result.rows.map(toStory);
}

async function createStory(payload, user) {
  const text = String(payload.text || '').trim();
  const mediaType = payload.mediaType || null;
  const mediaUrl = payload.mediaUrl || null;
  const durationMs = payload.durationMs ? Math.max(Number(payload.durationMs), 1000) : null;
  const backgroundColor = payload.backgroundColor || '#111827';

  if (!text && !mediaType && !mediaUrl) {
    throw createHttpError(400, 'empty_story', 'Ajoute un texte ou un media pour publier ta story.');
  }

  if (mediaType && !['image', 'video'].includes(mediaType)) {
    throw createHttpError(400, 'invalid_story_media_type', 'Type de media story invalide.');
  }

  const result = await query(
    `INSERT INTO stories (author_id, text, media_type, media_url, duration_ms, background_color)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *,
       $7::TEXT AS author_username,
       $8::TEXT AS author_display_name,
       0::INTEGER AS views_count`,
    [
      user.id,
      text || null,
      mediaType,
      mediaUrl,
      durationMs,
      backgroundColor,
      user.username,
      user.displayName,
    ],
  );

  return toStory(result.rows[0]);
}

async function markViewed(storyId, viewer) {
  const result = await transaction(async (client) => {
    const story = await client.query(
      `SELECT id, author_id
       FROM stories
       WHERE id = $1
         AND status = 'published'
         AND expires_at > now()
       LIMIT 1`,
      [storyId],
    );

    if (story.rowCount === 0) {
      throw createHttpError(404, 'story_not_found', 'Story introuvable.');
    }

    if (story.rows[0].author_id === viewer.id) {
      const views = await client.query(
        `SELECT COUNT(*)::INTEGER AS views_count
         FROM story_views
         WHERE story_id = $1`,
        [storyId],
      );

      return views.rows[0].views_count;
    }

    await client.query(`UPDATE users SET last_seen_at = now() WHERE id = $1`, [viewer.id]);
    await client.query(
      `INSERT INTO story_views (story_id, viewer_id)
       VALUES ($1, $2)
       ON CONFLICT (story_id, viewer_id)
       DO UPDATE SET viewed_at = now()`,
      [storyId, viewer.id],
    );

    const views = await client.query(
      `SELECT COUNT(*)::INTEGER AS views_count
       FROM story_views
       WHERE story_id = $1`,
      [storyId],
    );

    return views.rows[0].views_count;
  });

  return { viewed: true, viewsCount: result };
}

async function getStory(storyId) {
  const storyResult = await query(
    `SELECT stories.*,
            users.username AS author_username,
            users.display_name AS author_display_name,
            COUNT(story_views.viewer_id)::INTEGER AS views_count
     FROM stories
     INNER JOIN users ON users.id = stories.author_id
     LEFT JOIN story_views ON story_views.story_id = stories.id
     WHERE stories.id = $1
       AND stories.status = 'published'
       AND stories.expires_at > now()
     GROUP BY stories.id, users.username, users.display_name
     LIMIT 1`,
    [storyId],
  );

  if (storyResult.rowCount === 0) {
    throw createHttpError(404, 'story_not_found', 'Story introuvable.');
  }

  const viewersResult = await query(
    `SELECT story_views.viewer_id,
            story_views.viewed_at,
            users.username AS viewer_username,
            users.display_name AS viewer_display_name,
            users.last_seen_at AS viewer_last_seen_at,
            users.last_seen_at > now() - interval '2 minutes' AS online
     FROM story_views
     INNER JOIN users ON users.id = story_views.viewer_id
     WHERE story_views.story_id = $1
     ORDER BY story_views.viewed_at DESC`,
    [storyId],
  );

  return {
    story: toStory(storyResult.rows[0]),
    viewers: viewersResult.rows.map(toViewer),
  };
}

module.exports = {
  storiesService: {
    createStory,
    getStory,
    listStories,
    markViewed,
  },
};
