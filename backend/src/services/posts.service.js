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

const posts = new Map();
const comments = new Map();
const likes = new Map();
const postAttemptsByUser = new Map();
const commentAttemptsByUser = new Map();
const feedCache = new Map();
let seeded = false;

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedPosts() {
  if (seeded) {
    return;
  }

  seeded = true;

  const now = Date.now();
  [
    {
      authorId: 'seed_maya',
      author: 'maya_explores',
      title: 'Oia au coucher du soleil',
      caption: 'Snack local, lumiere folle et spot calme juste avant la foule.',
      mediaType: 'video',
      mediaUrl: 'https://example.com/oia.mp4',
      mediaSizeBytes: 18 * 1024 * 1024,
      format: 'vlog',
      location: 'Santorin, Grece',
      season: 'summer',
      tags: ['soleil', 'plage', 'budget'],
      likesCount: 2847,
      commentsCount: 42,
      sharesCount: 18,
      createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
    },
    {
      authorId: 'seed_nora',
      author: 'nora.nomad',
      title: 'Matin au Fushimi Inari',
      caption: 'Arriver a 6h change tout: lumiere douce, allees calmes, budget zero.',
      mediaType: 'image',
      mediaUrl: 'https://example.com/kyoto.jpg',
      mediaSizeBytes: 4 * 1024 * 1024,
      format: 'tip',
      location: 'Kyoto, Japon',
      season: 'autumn',
      tags: ['ville', 'marche', 'food'],
      likesCount: 1922,
      commentsCount: 31,
      sharesCount: 12,
      createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
    },
    {
      authorId: 'seed_sophie',
      author: 'sophie_bpkt',
      title: 'Hanami: incontournable ou trop touristique ?',
      caption: 'Joli debat ouvert apres une soiree sous les cerisiers.',
      mediaType: 'text',
      format: 'debate',
      location: 'Tokyo, Japon',
      season: 'spring',
      tags: ['hanami', 'culture', 'slowtravel'],
      likesCount: 1488,
      commentsCount: 96,
      sharesCount: 27,
      createdAt: new Date(now - 1000 * 60 * 180).toISOString(),
    },
  ].forEach((post) => {
    const id = createId('post');
    posts.set(id, {
      id,
      status: 'published',
      publishedAt: post.createdAt,
      updatedAt: post.createdAt,
      ...post,
    });
  });
}

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

function toCursor(post) {
  return Buffer.from(`${post.createdAt}|${post.id}`).toString('base64url');
}

function fromCursor(cursor) {
  if (!cursor) {
    return null;
  }

  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    return { createdAt, id };
  } catch {
    throw createHttpError(400, 'invalid_cursor', 'Cursor invalide.');
  }
}

function getTrendingScore(post) {
  const ageHours = Math.max(1, (Date.now() - Date.parse(post.createdAt)) / 36e5);
  return (post.likesCount * 2 + post.commentsCount * 3 + post.sharesCount) / ageHours;
}

function listFeed({ cursor, limit = pageSizeDefault, sort = 'recent' } = {}) {
  seedPosts();

  const safeLimit = Math.min(Number(limit) || pageSizeDefault, pageSizeMax);
  const safeSort = sort === 'trending' ? 'trending' : 'recent';
  const cacheKey = `${safeSort}:${cursor || 'first'}:${safeLimit}`;
  const cached = feedCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const cursorData = fromCursor(cursor);
  let items = [...posts.values()].filter((post) => post.status === 'published');

  items.sort((a, b) => {
    if (safeSort === 'trending') {
      return getTrendingScore(b) - getTrendingScore(a);
    }

    return b.createdAt.localeCompare(a.createdAt);
  });

  if (cursorData && safeSort === 'recent') {
    items = items.filter(
      (post) =>
        post.createdAt < cursorData.createdAt ||
        (post.createdAt === cursorData.createdAt && post.id < cursorData.id),
    );
  }

  const page = items.slice(0, safeLimit);
  const nextCursor = page.length === safeLimit ? toCursor(page[page.length - 1]) : null;
  const payload = { items: page, nextCursor, sort: safeSort };

  feedCache.set(cacheKey, { payload, expiresAt: Date.now() + 20 * 1000 });
  return payload;
}

function createPost(payload, user) {
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

  const now = new Date().toISOString();
  const post = {
    id: createId('post'),
    authorId: user.id,
    author: user.username,
    title: String(payload.title || '').trim(),
    caption,
    mediaUrl: payload.mediaUrl,
    mediaType: payload.mediaType,
    mediaSizeBytes: Number(payload.mediaSizeBytes) || 0,
    format: payload.format,
    location: String(payload.location || '').trim(),
    season: payload.season,
    tags: normalizeTags(payload.tags),
    status: 'published',
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  };

  posts.set(post.id, post);
  invalidateFeedCache();

  return post;
}

function getPost(postId) {
  seedPosts();
  const post = posts.get(postId);

  if (!post) {
    throw createHttpError(404, 'post_not_found', 'Post introuvable.');
  }

  return post;
}

function listComments(postId) {
  getPost(postId);

  return [...comments.values()]
    .filter((comment) => comment.postId === postId && comment.status === 'published')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function addComment(postId, payload, user) {
  const post = getPost(postId);
  const content = String(payload.content || '').trim();

  if (content.length < 2 || content.length > 800) {
    throw createHttpError(
      400,
      'invalid_comment',
      'Le commentaire doit faire entre 2 et 800 caracteres.',
    );
  }

  assertNoSpam(commentAttemptsByUser, user.id, content, 10, 10 * 60 * 1000);

  const now = new Date().toISOString();
  const comment = {
    id: createId('comment'),
    postId,
    authorId: user.id,
    author: user.username,
    content,
    status: 'published',
    createdAt: now,
    updatedAt: now,
  };

  comments.set(comment.id, comment);
  post.commentsCount += 1;
  invalidateFeedCache();

  return comment;
}

function toggleLike(postId, user) {
  const post = getPost(postId);
  const likeKey = `${user.id}:${postId}`;
  const isLiked = likes.has(likeKey);

  if (isLiked) {
    likes.delete(likeKey);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    likes.set(likeKey, {
      id: createId('like'),
      postId,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    post.likesCount += 1;
  }

  invalidateFeedCache();
  return { liked: !isLiked, likesCount: post.likesCount };
}

function sharePost(postId) {
  const post = getPost(postId);
  post.sharesCount += 1;
  invalidateFeedCache();

  return { sharesCount: post.sharesCount };
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
