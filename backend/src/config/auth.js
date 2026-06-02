const authConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    cookieName: process.env.REFRESH_COOKIE_NAME || 'truefeed_refresh',
  },
  password: {
    minLength: 8,
    hashRounds: 12,
  },
};

module.exports = {
  authConfig,
};
