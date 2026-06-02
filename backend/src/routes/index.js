const express = require('express');

const { contentRouter } = require('./modules/content.routes');
const { healthRouter } = require('./modules/health.routes');
const { postsRouter } = require('./modules/posts.routes');
const { schemaRouter } = require('./modules/schema.routes');

const apiRouter = express.Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/schema', schemaRouter);
apiRouter.use('/posts', postsRouter);
apiRouter.use('/', contentRouter);

module.exports = {
  apiRouter,
};
