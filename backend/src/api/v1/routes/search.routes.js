// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { analyticsService } = require('../../../services/analytics.service');
const { searchService } = require('../../../services/search.service');

const searchV1Router = express.Router();

searchV1Router.get('/', async (req, res, next) => {
  try {
    const result = await searchService.search({
      q: req.query.q,
      type: req.query.type,
      limit: req.query.limit,
    });

    analyticsService.track('search', {
      query: result.query,
      type: result.type,
      resultsCount: result.items.length,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  searchV1Router,
};
