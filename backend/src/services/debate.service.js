const { createHttpError } = require('../utils/httpError');

const threads = new Map();
const replies = new Map();
const votes = new Map();

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedThreads() {
  if (threads.size > 0) {
    return;
  }

  [
    {
      title: 'Voyager avec 7kg max : liberte ou contrainte ?',
      body: 'Le minimalisme rend-il le voyage plus fluide, ou sacrifie-t-on trop de confort ?',
      tags: ['sac a dos', 'minimalisme'],
      author: 'sophie_bpkt',
      upVotes: 67,
      downVotes: 33,
    },
    {
      title: 'Slow travel ou tour intense pour un premier voyage ?',
      body: 'Rester longtemps dans une ville donne une autre profondeur, mais le premier voyage donne envie de tout voir.',
      tags: ['slowtravel', 'itineraire'],
      author: 'maya_explores',
      upVotes: 54,
      downVotes: 46,
    },
  ].forEach((thread) => {
    const now = new Date().toISOString();
    const id = createId('thread');
    threads.set(id, {
      id,
      repliesCount: 0,
      createdAt: now,
      updatedAt: now,
      ...thread,
    });
  });
}

function listThreads() {
  seedThreads();
  return [...threads.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getThread(threadId) {
  seedThreads();
  const thread = threads.get(threadId);

  if (!thread) {
    throw createHttpError(404, 'thread_not_found', 'Sujet introuvable.');
  }

  return {
    thread,
    replies: [...replies.values()]
      .filter((reply) => reply.threadId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

function createThread(payload, user) {
  const title = String(payload.title || '').trim();
  const body = String(payload.body || '').trim();

  if (title.length < 8 || body.length < 12) {
    throw createHttpError(400, 'invalid_thread', 'Titre ou contenu de debat trop court.');
  }

  const now = new Date().toISOString();
  const thread = {
    id: createId('thread'),
    title,
    body,
    tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 5) : [],
    authorId: user.id,
    author: user.username,
    upVotes: 0,
    downVotes: 0,
    repliesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  threads.set(thread.id, thread);
  return thread;
}

function addReply(threadId, payload, user) {
  const { thread } = getThread(threadId);
  const body = String(payload.body || '').trim();

  if (body.length < 2 || body.length > 1200) {
    throw createHttpError(400, 'invalid_reply', 'Reponse invalide.');
  }

  const now = new Date().toISOString();
  const reply = {
    id: createId('reply'),
    threadId,
    authorId: user.id,
    author: user.username,
    body,
    createdAt: now,
  };

  replies.set(reply.id, reply);
  thread.repliesCount += 1;
  thread.updatedAt = now;
  return reply;
}

function vote(threadId, value, user) {
  const { thread } = getThread(threadId);
  const normalizedValue = value === 'down' ? 'down' : 'up';
  const key = `${user.id}:${threadId}`;
  const previous = votes.get(key);

  if (previous === normalizedValue) {
    return thread;
  }

  if (previous === 'up') thread.upVotes -= 1;
  if (previous === 'down') thread.downVotes -= 1;
  if (normalizedValue === 'up') thread.upVotes += 1;
  if (normalizedValue === 'down') thread.downVotes += 1;

  votes.set(key, normalizedValue);
  return thread;
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
