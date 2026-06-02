const express = require('express');

const { analyticsService } = require('../../../services/analytics.service');
const { searchService } = require('../../../services/search.service');

const searchV1Router = express.Router();

searchV1Router.get('/', (req, res) => {
  const result = searchService.search({
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
});

module.exports = {
  searchV1Router,
};
