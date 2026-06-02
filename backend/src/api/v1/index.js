const express = require('express');

const { contentV1Router } = require('./routes/content.routes');
const { graphqlV1Router } = require('./routes/graphql.routes');
const { mediaV1Router } = require('./routes/media.routes');
const { postsV1Router } = require('./routes/posts.routes');

const apiV1Router = express.Router();

apiV1Router.use('/', contentV1Router);
apiV1Router.use('/graphql', graphqlV1Router);
apiV1Router.use('/media', mediaV1Router);
apiV1Router.use('/posts', postsV1Router);

module.exports = {
  apiV1Router,
};
