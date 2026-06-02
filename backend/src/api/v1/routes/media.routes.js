const express = require('express');

const { mediaService } = require('../../../services/media.service');

const mediaV1Router = express.Router();

mediaV1Router.post('/presign', (req, res, next) => {
  try {
    const upload = mediaService.createPresignedUpload(req.body ?? {});

    res.status(201).json({ upload });
  } catch (error) {
    next(error);
  }
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
