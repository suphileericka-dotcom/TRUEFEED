const express = require('express');

const { resolvers } = require('../resolvers');

const contentV1Router = express.Router();

contentV1Router.get('/feed', (_req, res) => {
  res.json(resolvers.content.feed());
});

contentV1Router.get('/destinations', (_req, res) => {
  res.json(resolvers.content.destinations());
});

contentV1Router.get('/debates', (_req, res) => {
  res.json(resolvers.content.debates());
});

module.exports = {
  contentV1Router,
};
