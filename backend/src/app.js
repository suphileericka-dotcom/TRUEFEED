const cors = require('cors');
const express = require('express');

const { env } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { requestLogger } = require('./middlewares/requestLogger');
const { securityHeaders } = require('./middlewares/securityHeaders');
const { apiRouter } = require('./routes');

const app = express();

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

function isAllowedOrigin(origin) {
  if (!origin || env.clientOrigins.includes(origin)) {
    return true;
  }

  if (env.clientOrigins.includes('*') && env.nodeEnv !== 'production') {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);

    if (protocol !== 'https:' && env.nodeEnv !== 'development') {
      return false;
    }

    return env.vercelProjectHostPatterns.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app,
};
