// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const { createHttpError } = require('../utils/httpError');

function createRateLimiter({ windowMs, max, keyPrefix = 'rate' }) {
  const hits = new Map();

  return function rateLimiter(req, _res, next) {
    const key = `${keyPrefix}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count += 1;

    if (entry.count > max) {
      next(
        createHttpError(
          429,
          'rate_limited',
          'Trop de tentatives. Reessaie dans quelques minutes.',
          { retryAfterMs: entry.resetAt - now },
        ),
      );
      return;
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
};
