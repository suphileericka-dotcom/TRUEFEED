const express = require('express');

const { resolvers } = require('../resolvers');

const mediaV1Router = express.Router();

mediaV1Router.post('/presign', (req, res) => {
  const result = resolvers.media.createPresignedUpload(req.body ?? {});

  res.status(result.ok ? 201 : 400).json(result);
});

mediaV1Router.post('/complete', (req, res) => {
  res.status(202).json({
    ok: true,
    media: req.body ?? {},
    message: 'Confirmation media recue. Persistance a brancher avec la base de donnees.',
  });
});

module.exports = {
  mediaV1Router,
};
