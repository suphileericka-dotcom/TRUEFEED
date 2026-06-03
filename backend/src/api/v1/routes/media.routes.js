const express = require('express');

const { requireAuth } = require('../../../middlewares/auth');
const { mediaService } = require('../../../services/media.service');

const mediaV1Router = express.Router();

mediaV1Router.post('/presign', requireAuth, async (req, res, next) => {
  try {
    const upload = await mediaService.createPresignedUpload(req.body ?? {}, req.user);

    res.status(201).json({ upload });
  } catch (error) {
    next(error);
  }
});

mediaV1Router.post('/complete', requireAuth, async (req, res, next) => {
  try {
    const result = req.body?.uploadId
      ? await mediaService.completeMultipartUpload(req.body)
      : { ok: true, key: req.body?.key };

    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  mediaV1Router,
};
