// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { requireAuth, requireRole } = require('../../../middlewares/auth');
const { moderationService } = require('../../../services/moderation.service');
const { validate } = require('../../../utils/validation');

const moderationV1Router = express.Router();

const reportSchema = {
  targetType: { type: 'string', required: true, enum: ['post', 'comment', 'user', 'thread', 'reply'] },
  targetId: { type: 'string', required: true, minLength: 2, maxLength: 120 },
  reason: {
    type: 'string',
    required: true,
    enum: ['spam', 'harassment', 'misinformation', 'illegal_content', 'other'],
  },
  content: { type: 'string', maxLength: 2000 },
};

moderationV1Router.post('/reports', requireAuth, (req, res, next) => {
  try {
    const payload = validate(reportSchema, req.body);
    const report = moderationService.autoFlag({ ...payload, reporterId: req.user.id });

    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});

moderationV1Router.get('/reports', requireAuth, requireRole(['admin', 'moderator']), (_req, res) => {
  res.json({ items: moderationService.listReports() });
});

module.exports = {
  moderationV1Router,
};
