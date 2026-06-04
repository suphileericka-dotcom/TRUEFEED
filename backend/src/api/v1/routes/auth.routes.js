const express = require('express');

const { authConfig } = require('../../../config/auth');
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
  username: { type: 'string', required: true, minLength: 3, maxLength: 32 },
  email: { type: 'string', required: true, email: true, maxLength: 160 },
  password: { type: 'string', required: true, minLength: authConfig.password.minLength },
  displayName: { type: 'string', required: true, minLength: 2, maxLength: 80 },
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
