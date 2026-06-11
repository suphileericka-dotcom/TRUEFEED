// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { requireAuth, requireRole } = require('../../../middlewares/auth');
const { query, transaction } = require('../../../data/db');
const { authService } = require('../../../services/auth.service');
const { createHttpError } = require('../../../utils/httpError');
const { validate } = require('../../../utils/validation');

const usersV1Router = express.Router();

const profileSchema = {
  displayName: { type: 'string', minLength: 2, maxLength: 80 },
  avatarUrl: { type: 'string', url: true, maxLength: 500 },
  bio: { type: 'string', maxLength: 240 },
  language: { type: 'string', enum: ['fr', 'en'] },
};

usersV1Router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user,
  });
});

function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
    stats: {
      posts: Number(row.posts_count || 0),
      followers: Number(row.followers_count || 0),
      following: Number(row.following_count || 0),
    },
    relation: row.relation || 'none',
  };
}

function toFriendRequest(row) {
  return {
    id: row.id,
    type: 'friend_request',
    createdAt: row.created_at,
    from: {
      id: row.requester_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    },
  };
}

async function getPublicUser(userIdOrUsername, viewerId) {
  const result = await query(
    `WITH target_user AS (
       SELECT *
       FROM users
       WHERE status = 'active'
         AND (id::text = $1 OR lower(username) = lower(regexp_replace($1, '^@', '')))
       LIMIT 1
     )
     SELECT
       target_user.id,
       target_user.username,
       target_user.display_name,
       target_user.avatar_url,
       target_user.bio,
       target_user.created_at,
       (SELECT COUNT(*) FROM posts WHERE posts.author_id = target_user.id AND posts.status = 'published') AS posts_count,
       (SELECT COUNT(*) FROM user_connections WHERE addressee_id = target_user.id AND status = 'accepted') AS followers_count,
       (SELECT COUNT(*) FROM user_connections WHERE requester_id = target_user.id AND status = 'accepted') AS following_count,
       CASE
         WHEN $2::uuid IS NULL THEN 'none'
         WHEN target_user.id = $2::uuid THEN 'self'
         WHEN EXISTS (
           SELECT 1 FROM user_connections
           WHERE requester_id = $2::uuid AND addressee_id = target_user.id AND status = 'accepted'
         ) THEN 'friends'
         WHEN EXISTS (
           SELECT 1 FROM user_connections
           WHERE requester_id = $2::uuid AND addressee_id = target_user.id AND status = 'pending'
         ) THEN 'pending_sent'
         WHEN EXISTS (
           SELECT 1 FROM user_connections
           WHERE requester_id = target_user.id AND addressee_id = $2::uuid AND status = 'pending'
         ) THEN 'pending_received'
         ELSE 'none'
       END AS relation
     FROM target_user`,
    [userIdOrUsername, viewerId || null],
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, 'user_not_found', 'Utilisateur introuvable.');
  }

  return toPublicUser(result.rows[0]);
}

usersV1Router.get('/public', async (req, res, next) => {
  try {
    const search = String(req.query.q || '').trim().replace(/^@/, '');
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const viewerId = req.query.viewerId || null;
    const params = [`%${search}%`, limit, viewerId];
    const result = await query(
      `SELECT
         users.id,
         users.username,
         users.display_name,
         users.avatar_url,
         users.bio,
         users.created_at,
         (SELECT COUNT(*) FROM posts WHERE posts.author_id = users.id AND posts.status = 'published') AS posts_count,
         (SELECT COUNT(*) FROM user_connections WHERE addressee_id = users.id AND status = 'accepted') AS followers_count,
         (SELECT COUNT(*) FROM user_connections WHERE requester_id = users.id AND status = 'accepted') AS following_count,
         CASE
           WHEN $3::uuid IS NULL THEN 'none'
           WHEN users.id = $3::uuid THEN 'self'
           WHEN EXISTS (
             SELECT 1 FROM user_connections
             WHERE requester_id = $3::uuid AND addressee_id = users.id AND status = 'accepted'
           ) THEN 'friends'
           WHEN EXISTS (
             SELECT 1 FROM user_connections
             WHERE requester_id = $3::uuid AND addressee_id = users.id AND status = 'pending'
           ) THEN 'pending_sent'
           WHEN EXISTS (
             SELECT 1 FROM user_connections
             WHERE requester_id = users.id AND addressee_id = $3::uuid AND status = 'pending'
           ) THEN 'pending_received'
           ELSE 'none'
         END AS relation
       FROM users
       WHERE users.status = 'active'
         AND ($3::uuid IS NULL OR users.id <> $3::uuid)
         AND ($1 = '%%' OR lower(users.username) LIKE lower($1) OR lower(users.display_name) LIKE lower($1))
       ORDER BY users.created_at DESC
       LIMIT $2`,
      params,
    );

    res.json({ items: result.rows.map(toPublicUser) });
  } catch (error) {
    next(error);
  }
});

usersV1Router.get('/public/:id', async (req, res, next) => {
  try {
    res.json({ user: await getPublicUser(req.params.id, req.query.viewerId) });
  } catch (error) {
    next(error);
  }
});

usersV1Router.post('/:id/friend-requests', requireAuth, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      throw createHttpError(400, 'self_friend_request', 'Impossible de t ajouter toi-meme.');
    }

    const target = await query(
      `SELECT id FROM users WHERE id::text = $1 AND status = 'active' LIMIT 1`,
      [req.params.id],
    );

    if (target.rowCount === 0) {
      throw createHttpError(404, 'user_not_found', 'Utilisateur introuvable.');
    }

    const reverse = await query(
      `SELECT id, status
       FROM user_connections
       WHERE requester_id = $1 AND addressee_id = $2
       LIMIT 1`,
      [req.params.id, req.user.id],
    );

    if (reverse.rows[0]?.status === 'pending') {
      throw createHttpError(409, 'request_already_received', 'Cette personne t a deja envoye une demande.');
    }

    const request = await query(
      `INSERT INTO user_connections (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (requester_id, addressee_id)
       DO UPDATE SET
         status = CASE
           WHEN user_connections.status = 'accepted' THEN 'accepted'::user_connection_status
           ELSE 'pending'::user_connection_status
         END,
         responded_at = CASE
           WHEN user_connections.status = 'accepted' THEN user_connections.responded_at
           ELSE NULL
         END,
         updated_at = now()
       RETURNING id, status, created_at`,
      [req.user.id, req.params.id],
    );

    res.status(201).json({ request: request.rows[0] });
  } catch (error) {
    next(error);
  }
});

usersV1Router.get('/me/notifications', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         user_connections.id,
         user_connections.requester_id,
         user_connections.created_at,
         users.username,
         users.display_name,
         users.avatar_url
       FROM user_connections
       INNER JOIN users ON users.id = user_connections.requester_id
       WHERE user_connections.addressee_id = $1
         AND user_connections.status = 'pending'
         AND users.status = 'active'
       ORDER BY user_connections.created_at DESC`,
      [req.user.id],
    );

    res.json({ items: result.rows.map(toFriendRequest) });
  } catch (error) {
    next(error);
  }
});

usersV1Router.post('/me/friend-requests/:requestId/resolve', requireAuth, async (req, res, next) => {
  try {
    const accepted = Boolean(req.body?.accepted);
    const request = await transaction(async (client) => {
      const updated = await client.query(
        `UPDATE user_connections
         SET status = $3::user_connection_status,
             responded_at = now(),
             updated_at = now()
         WHERE id = $1
           AND addressee_id = $2
           AND status = 'pending'
         RETURNING id, requester_id, addressee_id, status`,
        [req.params.requestId, req.user.id, accepted ? 'accepted' : 'rejected'],
      );

      if (updated.rowCount === 0) {
        throw createHttpError(404, 'friend_request_not_found', 'Demande introuvable.');
      }

      return updated.rows[0];
    });

    res.json({ request });
  } catch (error) {
    next(error);
  }
});

usersV1Router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(profileSchema, req.body);
    const user = await authService.updateProfile(req.user.id, payload);

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

usersV1Router.get('/admin/check', requireAuth, requireRole(['admin']), (req, res) => {
  res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = {
  usersV1Router,
};
