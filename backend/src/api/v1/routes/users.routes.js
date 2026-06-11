// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { requireAuth, requireRole } = require('../../../middlewares/auth');
const { authService } = require('../../../services/auth.service');
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
