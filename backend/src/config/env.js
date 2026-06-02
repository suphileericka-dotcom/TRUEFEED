require('dotenv').config();

const env = {
  appName: 'TRUEFEED API',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === 'true',
};

module.exports = {
  env,
};
