const express = require('express');

const { requireAuth } = require('../../../middlewares/auth');
const { storiesService } = require('../../../services/stories.service');
const { validate } = require('../../../utils/validation');

const storiesV1Router = express.Router();

const createStorySchema = {
  text: { type: 'string', maxLength: 500 },
  mediaType: { type: 'string', enum: ['image', 'video'] },
  mediaUrl: { type: 'string', url: true, maxLength: 500 },
  backgroundColor: { type: 'string', maxLength: 24 },
};

storiesV1Router.get('/', async (req, res, next) => {
  try {
    res.json({
      items: await storiesService.listStories({ limit: req.query.limit }),
    });
  } catch (error) {
    next(error);
  }
});

storiesV1Router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(createStorySchema, req.body);
    const story = await storiesService.createStory(payload, req.user);

    res.status(201).json({ story });
  } catch (error) {
    next(error);
  }
});

storiesV1Router.get('/:storyId', async (req, res, next) => {
  try {
    res.json(await storiesService.getStory(req.params.storyId));
  } catch (error) {
    next(error);
  }
});

storiesV1Router.post('/:storyId/view', requireAuth, async (req, res, next) => {
  try {
    res.json(await storiesService.markViewed(req.params.storyId, req.user));
  } catch (error) {
    next(error);
  }
});

module.exports = {
  storiesV1Router,
};
