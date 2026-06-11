// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
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

debateV1Router.get('/threads', async (_req, res, next) => {
  try {
    res.json({ items: await debateService.listThreads() });
  } catch (error) {
    next(error);
  }
});

debateV1Router.post('/threads', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(threadSchema, req.body);
    const thread = await debateService.createThread(
      { ...payload, tags: Array.isArray(req.body.tags) ? req.body.tags : [] },
      req.user,
    );

    res.status(201).json({ thread });
  } catch (error) {
    next(error);
  }
});

debateV1Router.get('/threads/:threadId', async (req, res, next) => {
  try {
    res.json(await debateService.getThread(req.params.threadId));
  } catch (error) {
    next(error);
  }
});

debateV1Router.post('/threads/:threadId/replies', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(replySchema, req.body);
    const reply = await debateService.addReply(req.params.threadId, payload, req.user);

    res.status(201).json({ reply });
  } catch (error) {
    next(error);
  }
});

debateV1Router.post('/threads/:threadId/votes', requireAuth, async (req, res, next) => {
  try {
    const thread = await debateService.vote(req.params.threadId, req.body.value, req.user);

    res.json({ thread });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  debateV1Router,
};
