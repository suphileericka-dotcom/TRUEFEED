// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { postsService } = require('../../services/posts.service');

const postsRouter = express.Router();

postsRouter.post('/', (req, res) => {
  const draft = postsService.createDraft(req.body);

  res.status(201).json({
    message: 'Brouillon recu. Branche cette route a la base de donnees ensuite.',
    ...draft,
  });
});

module.exports = {
  postsRouter,
};
