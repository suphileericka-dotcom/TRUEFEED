// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { authConfig } = require('../../../config/auth');
const { requireAuth } = require('../../../middlewares/auth');
const { createRateLimiter } = require('../../../middlewares/rateLimit');
const { analyticsService } = require('../../../services/analytics.service');
const { authService } = require('../../../services/auth.service');
const { validate } = require('../../../utils/validation');

const authV1Router = express.Router();

const loginRateLimit = createRateLimiter({
  windowMs: authConfig.loginRateLimit.windowMs,
  max: authConfig.loginRateLimit.max,
  keyPrefix: 'login',
});

const registerSchema = {
  firstName: { type: 'string', required: true, minLength: 2, maxLength: 60 },
  lastName: { type: 'string', required: true, minLength: 2, maxLength: 60 },
  email: { type: 'string', required: true, email: true, maxLength: 160 },
  password: { type: 'string', required: true, minLength: authConfig.password.minLength },
  avatarUrl: { type: 'string', url: true, maxLength: 500 },
  bio: { type: 'string', maxLength: 240 },
};

const loginSchema = {
  email: { type: 'string', required: true, email: true, maxLength: 160 },
  password: { type: 'string', required: true, minLength: 1 },
};

const refreshSchema = {
  refreshToken: { type: 'string', required: true, minLength: 20 },
};

const verifyEmailSchema = {
  email: { type: 'string', email: true, maxLength: 160 },
  code: { type: 'string', maxLength: 160 },
  token: { type: 'string', maxLength: 160 },
};

const usernameSchema = {
  username: { type: 'string', maxLength: 32 },
  firstName: { type: 'string', required: true, minLength: 2, maxLength: 60 },
};

const forgotPasswordSchema = {
  email: { type: 'string', required: true, email: true, maxLength: 160 },
};

const resetPasswordSchema = {
  token: { type: 'string', required: true, minLength: 20, maxLength: 160 },
  password: { type: 'string', required: true, minLength: authConfig.password.minLength },
};

const changePasswordSchema = {
  currentPassword: { type: 'string', required: true, minLength: 1 },
  newPassword: { type: 'string', required: true, minLength: authConfig.password.minLength },
};

authV1Router.post('/register', async (req, res, next) => {
  try {
    const payload = validate(registerSchema, req.body);
    const result = await authService.register(payload);

    analyticsService.track('signup', { userId: result.user.id, role: result.user.role });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authV1Router.post('/verify-email', async (req, res, next) => {
  try {
    const payload = validate(verifyEmailSchema, req.body);
    const result = await authService.verifyEmail({
      ...payload,
      code: payload.token || payload.code,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

authV1Router.post('/forgot-password', async (req, res, next) => {
  try {
    const payload = validate(forgotPasswordSchema, req.body);
    const result = await authService.requestPasswordReset(payload);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

authV1Router.post('/reset-password', async (req, res, next) => {
  try {
    const payload = validate(resetPasswordSchema, req.body);
    const result = await authService.resetPassword(payload);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

authV1Router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(changePasswordSchema, req.body);
    const result = await authService.changePassword(req.user.id, payload);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

authV1Router.post('/username', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(usernameSchema, req.body);
    const result = await authService.completeUsername(req.user.id, payload);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

authV1Router.post('/login', loginRateLimit, async (req, res, next) => {
  try {
    const payload = validate(loginSchema, req.body);
    const result = await authService.login(payload);

    analyticsService.track('login', { userId: result.user.id });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authV1Router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = validate(refreshSchema, req.body);
    const result = await authService.refresh(refreshToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

authV1Router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = validate(refreshSchema, req.body);

    await authService.logout(refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = {
  authV1Router,
};
