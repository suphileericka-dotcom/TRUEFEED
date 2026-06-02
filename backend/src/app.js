const cors = require('cors');
const express = require('express');

const { env } = require('./config/env');
const { apiRouter } = require('./routes');

const app = express();

app.use(
  cors({
    origin: env.clientOrigin === '*' ? true : env.clientOrigin,
  }),
);
app.use(express.json());

app.use('/api', apiRouter);

module.exports = {
  app,
};
