const express = require('express');

const { env } = require('../../config/env');

const healthRouter = express.Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    app: env.appName,
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', (_req, res) => {
  res.json({
    ok: true,
    checks: {
      server: 'ok',
      config: 'ok',
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  healthRouter,
};
