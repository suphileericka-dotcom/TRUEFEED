// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { requireAuth } = require('../../../middlewares/auth');
const { analyticsService } = require('../../../services/analytics.service');
const { postsService } = require('../../../services/posts.service');
const { validate } = require('../../../utils/validation');

const postsV1Router = express.Router();

const createPostSchema = {
  title: { type: 'string', maxLength: 120 },
  caption: { type: 'string', required: true, minLength: 2, maxLength: 2200 },
  mediaUrl: { type: 'string', url: true, maxLength: 500 },
  mediaType: { type: 'string', required: true, enum: ['image', 'video', 'text'] },
  format: { type: 'string', required: true, enum: ['vlog', 'photo', 'tip', 'debate'] },
  location: { type: 'string', maxLength: 120 },
  season: { type: 'string', enum: ['spring', 'summer', 'autumn', 'winter'] },
};

const commentSchema = {
  content: { type: 'string', required: true, minLength: 2, maxLength: 800 },
  parentId: { type: 'string' },
};

postsV1Router.get('/feed', async (req, res, next) => {
  try {
    const feed = await postsService.listFeed({
      cursor: req.query.cursor,
      limit: req.query.limit,
      sort: req.query.sort,
    });

    res.json(feed);
  } catch (error) {
    next(error);
  }
});

postsV1Router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(createPostSchema, req.body);
    const post = await postsService.createPost(
      {
        ...payload,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        mediaSizeBytes: req.body.mediaSizeBytes,
      },
      req.user,
    );

    analyticsService.track('post_create', { postId: post.id, userId: req.user.id });
    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

postsV1Router.get('/:postId', async (req, res, next) => {
  try {
    const post = await postsService.getPost(req.params.postId);
    const comments = await postsService.listComments(req.params.postId);

    res.json({ post, comments });
  } catch (error) {
    next(error);
  }
});

postsV1Router.patch('/:postId', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(createPostSchema, {
      ...req.body,
      mediaType: req.body.mediaType || 'text',
      format: req.body.format || 'photo',
    });
    const post = await postsService.updatePost(
      req.params.postId,
      {
        ...payload,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      },
      req.user,
    );

    res.json({ post });
  } catch (error) {
    next(error);
  }
});

postsV1Router.delete('/:postId', requireAuth, async (req, res, next) => {
  try {
    res.json(await postsService.deletePost(req.params.postId, req.user));
  } catch (error) {
    next(error);
  }
});

postsV1Router.get('/:postId/comments', async (req, res, next) => {
  try {
    res.json({
      items: await postsService.listComments(req.params.postId),
    });
  } catch (error) {
    next(error);
  }
});

postsV1Router.post('/:postId/comments', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(commentSchema, req.body);
    const comment = await postsService.addComment(req.params.postId, payload, req.user);

    analyticsService.track('comment_create', {
      postId: req.params.postId,
      commentId: comment.id,
      userId: req.user.id,
    });
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

postsV1Router.post('/comments/:commentId/like', requireAuth, async (req, res, next) => {
  try {
    const result = await postsService.toggleCommentLike(req.params.commentId, req.user);

    analyticsService.track('comment_like_toggle', {
      commentId: req.params.commentId,
      userId: req.user.id,
      liked: result.liked,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

postsV1Router.post('/:postId/like', requireAuth, async (req, res, next) => {
  try {
    const result = await postsService.toggleLike(req.params.postId, req.user);

    analyticsService.track('like_toggle', {
      postId: req.params.postId,
      userId: req.user.id,
      liked: result.liked,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

postsV1Router.post('/:postId/share', requireAuth, async (req, res, next) => {
  try {
    const result = await postsService.sharePost(req.params.postId, req.user);

    analyticsService.track('share', { postId: req.params.postId });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  postsV1Router,
};
