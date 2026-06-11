// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const authConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    expiresInMs: Number(process.env.ACCESS_TOKEN_EXPIRES_IN_MS) || 15 * 60 * 1000,
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    expiresInMs: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_MS) || 30 * 24 * 60 * 60 * 1000,
    cookieName: process.env.REFRESH_COOKIE_NAME || 'truefeed_refresh',
  },
  password: {
    minLength: 8,
    hashRounds: 12,
    iterations: Number(process.env.PASSWORD_HASH_ITERATIONS) || 120000,
  },
  loginRateLimit: {
    windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  },
};

module.exports = {
  authConfig,
};
