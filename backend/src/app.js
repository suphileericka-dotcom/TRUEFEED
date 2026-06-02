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

app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (env.clientOrigins.includes('*') || !origin || env.clientOrigins.includes(origin)) {
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
