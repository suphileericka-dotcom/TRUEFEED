const express = require('express');

const { contentService } = require('../../services/content.service');

const contentRouter = express.Router();

contentRouter.get('/feed', (_req, res) => {
  res.json(contentService.getFeed());
});

contentRouter.get('/destinations', (_req, res) => {
  res.json(contentService.getDestinations());
});

contentRouter.get('/debates', (_req, res) => {
  res.json(contentService.getDebates());
});

module.exports = {
  contentRouter,
};
