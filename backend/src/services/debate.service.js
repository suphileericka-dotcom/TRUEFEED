const { query } = require('../data/db');
const { createHttpError } = require('../utils/httpError');

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value, field = 'id') {
  if (!uuidPattern.test(String(value))) {
    throw createHttpError(400, 'invalid_id', `${field} invalide.`);
  }
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeTags(tags = []) {
  return [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()))]
    .filter(Boolean)
    .slice(0, 5);
}

function toThread(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    author: row.author_username,
    title: row.title,
    body: row.body,
    tags: row.tags || [],
    upVotes: row.up_votes,
    downVotes: row.down_votes,
    repliesCount: row.replies_count,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toReply(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    authorId: row.author_id,
    author: row.author_username,
    body: row.body,
    createdAt: toIso(row.created_at),
  };
}

async function getThreadRow(threadId) {
  assertUuid(threadId, 'threadId');

  const result = await query(
    `SELECT debate_threads.*, users.username AS author_username
     FROM debate_threads
     INNER JOIN users ON users.id = debate_threads.author_id
     WHERE debate_threads.id = $1
     LIMIT 1`,
    [threadId],
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, 'thread_not_found', 'Sujet introuvable.');
  }

  return result.rows[0];
}

async function listThreads() {
  const result = await query(
    `SELECT debate_threads.*, users.username AS author_username
     FROM debate_threads
     INNER JOIN users ON users.id = debate_threads.author_id
     ORDER BY debate_threads.updated_at DESC, debate_threads.created_at DESC
     LIMIT 50`,
  );

  return result.rows.map(toThread);
}

async function getThread(threadId) {
  const thread = toThread(await getThreadRow(threadId));
  const repliesResult = await query(
    `SELECT debate_replies.*, users.username AS author_username
     FROM debate_replies
     INNER JOIN users ON users.id = debate_replies.author_id
     WHERE debate_replies.thread_id = $1
     ORDER BY debate_replies.created_at ASC`,
    [threadId],
  );

  return {
    thread,
    replies: repliesResult.rows.map(toReply),
  };
}

async function createThread(payload, user) {
  const title = String(payload.title || '').trim();
  const body = String(payload.body || '').trim();

  if (title.length < 8 || body.length < 12) {
    throw createHttpError(400, 'invalid_thread', 'Titre ou contenu de debat trop court.');
  }

  const result = await query(
    `INSERT INTO debate_threads (author_id, title, body, tags)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user.id, title, body, normalizeTags(payload.tags)],
  );

  return toThread({
    ...result.rows[0],
    author_username: user.username,
  });
}

async function addReply(threadId, payload, user) {
  await getThreadRow(threadId);

  const body = String(payload.body || '').trim();

  if (body.length < 2 || body.length > 1200) {
    throw createHttpError(400, 'invalid_reply', 'Reponse invalide.');
  }

  const result = await query(
    `INSERT INTO debate_replies (thread_id, author_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [threadId, user.id, body],
  );

  await query(`UPDATE debate_threads SET updated_at = now() WHERE id = $1`, [threadId]);

  return toReply({
    ...result.rows[0],
    author_username: user.username,
  });
}

async function vote(threadId, value, user) {
  await getThreadRow(threadId);

  const normalizedValue = value === 'down' ? 'down' : 'up';
  const existing = await query(
    `SELECT value FROM debate_votes
     WHERE thread_id = $1 AND user_id = $2`,
    [threadId, user.id],
  );

  if (existing.rows[0]?.value === normalizedValue) {
    await query(
      `DELETE FROM debate_votes
       WHERE thread_id = $1 AND user_id = $2`,
      [threadId, user.id],
    );

    return toThread(await getThreadRow(threadId));
  }

  await query(
    `INSERT INTO debate_votes (thread_id, user_id, value)
     VALUES ($1, $2, $3)
     ON CONFLICT (thread_id, user_id)
     DO UPDATE SET value = EXCLUDED.value`,
    [threadId, user.id, normalizedValue],
  );

  return toThread(await getThreadRow(threadId));
}

module.exports = {
  debateService: {
    addReply,
    createThread,
    getThread,
    listThreads,
    vote,
  },
};
