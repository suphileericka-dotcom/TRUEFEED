const express = require('express');

const { resolvers } = require('../resolvers');

const postsV1Router = express.Router();

postsV1Router.post('/', (req, res) => {
  const draft = resolvers.posts.createPostDraft(req.body);

  res.status(201).json({
    message: 'Brouillon recu via API v1.',
    ...draft,
  });
});

module.exports = {
  postsV1Router,
};
