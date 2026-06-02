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
};

postsV1Router.get('/feed', (req, res, next) => {
  try {
    const feed = postsService.listFeed({
      cursor: req.query.cursor,
      limit: req.query.limit,
      sort: req.query.sort,
    });

    res.json(feed);
  } catch (error) {
    next(error);
  }
});

postsV1Router.post('/', requireAuth, (req, res, next) => {
  try {
    const payload = validate(createPostSchema, req.body);
    const post = postsService.createPost(
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

postsV1Router.get('/:postId', (req, res, next) => {
  try {
    const post = postsService.getPost(req.params.postId);
    const comments = postsService.listComments(req.params.postId);

    res.json({ post, comments });
  } catch (error) {
    next(error);
  }
});

postsV1Router.get('/:postId/comments', (req, res, next) => {
  try {
    res.json({
      items: postsService.listComments(req.params.postId),
    });
  } catch (error) {
    next(error);
  }
});

postsV1Router.post('/:postId/comments', requireAuth, (req, res, next) => {
  try {
    const payload = validate(commentSchema, req.body);
    const comment = postsService.addComment(req.params.postId, payload, req.user);

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

postsV1Router.post('/:postId/like', requireAuth, (req, res, next) => {
  try {
    const result = postsService.toggleLike(req.params.postId, req.user);

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

postsV1Router.post('/:postId/share', (req, res, next) => {
  try {
    const result = postsService.sharePost(req.params.postId);

    analyticsService.track('share', { postId: req.params.postId });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  postsV1Router,
};
