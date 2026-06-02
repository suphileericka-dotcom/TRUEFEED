const express = require('express');

const { requireAuth } = require('../../../middlewares/auth');
const { debateService } = require('../../../services/debate.service');
const { validate } = require('../../../utils/validation');

const debateV1Router = express.Router();

const threadSchema = {
  title: { type: 'string', required: true, minLength: 8, maxLength: 140 },
  body: { type: 'string', required: true, minLength: 12, maxLength: 2400 },
};

const replySchema = {
  body: { type: 'string', required: true, minLength: 2, maxLength: 1200 },
};

debateV1Router.get('/threads', (_req, res) => {
  res.json({ items: debateService.listThreads() });
});

debateV1Router.post('/threads', requireAuth, (req, res, next) => {
  try {
    const payload = validate(threadSchema, req.body);
    const thread = debateService.createThread(
      { ...payload, tags: Array.isArray(req.body.tags) ? req.body.tags : [] },
      req.user,
    );

    res.status(201).json({ thread });
  } catch (error) {
    next(error);
  }
});

debateV1Router.get('/threads/:threadId', (req, res, next) => {
  try {
    res.json(debateService.getThread(req.params.threadId));
  } catch (error) {
    next(error);
  }
});

debateV1Router.post('/threads/:threadId/replies', requireAuth, (req, res, next) => {
  try {
    const payload = validate(replySchema, req.body);
    const reply = debateService.addReply(req.params.threadId, payload, req.user);

    res.status(201).json({ reply });
  } catch (error) {
    next(error);
  }
});

debateV1Router.post('/threads/:threadId/votes', requireAuth, (req, res, next) => {
  try {
    const thread = debateService.vote(req.params.threadId, req.body.value, req.user);

    res.json({ thread });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  debateV1Router,
};
