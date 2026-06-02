const express = require('express');

const { resolvers } = require('../resolvers');

const graphqlV1Router = express.Router();

const queryMap = {
  feed: () => resolvers.content.feed(),
  destinations: () => resolvers.content.destinations(),
  debates: () => resolvers.content.debates(),
};

graphqlV1Router.post('/', (req, res) => {
  const { query } = req.body ?? {};
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';
  const resolver = queryMap[normalizedQuery];

  if (!resolver) {
    res.status(400).json({
      errors: [
        {
          message: 'Query non supportee pour le MVP. Utilise: feed, destinations, debates.',
        },
      ],
    });
    return;
  }

  res.json({
    data: {
      [normalizedQuery]: resolver(),
    },
  });
});

module.exports = {
  graphqlV1Router,
};
