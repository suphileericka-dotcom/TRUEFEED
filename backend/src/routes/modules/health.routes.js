const express = require('express');

const { env } = require('../../config/env');

const healthRouter = express.Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    app: env.appName,
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  healthRouter,
};
