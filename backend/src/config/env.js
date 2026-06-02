require('dotenv').config();

const env = {
  appName: 'TRUEFEED API',
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
};

module.exports = {
  env,
};
