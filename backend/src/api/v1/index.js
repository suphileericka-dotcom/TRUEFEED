const express = require('express');

const { authV1Router } = require('./routes/auth.routes');
const { contentV1Router } = require('./routes/content.routes');
const { debateV1Router } = require('./routes/debate.routes');
const { goodTipsV1Router } = require('./routes/goodTips.routes');
const { graphqlV1Router } = require('./routes/graphql.routes');
const { mapV1Router } = require('./routes/map.routes');
const { mediaV1Router } = require('./routes/media.routes');
const { moderationV1Router } = require('./routes/moderation.routes');
const { postsV1Router } = require('./routes/posts.routes');
const { searchV1Router } = require('./routes/search.routes');
const { storiesV1Router } = require('./routes/stories.routes');
const { translationV1Router } = require('./routes/translation.routes');
const { usersV1Router } = require('./routes/users.routes');

const apiV1Router = express.Router();

apiV1Router.use('/', contentV1Router);
apiV1Router.use('/auth', authV1Router);
apiV1Router.use('/debate', debateV1Router);
apiV1Router.use('/good-tips', goodTipsV1Router);
apiV1Router.use('/graphql', graphqlV1Router);
apiV1Router.use('/map', mapV1Router);
apiV1Router.use('/media', mediaV1Router);
apiV1Router.use('/moderation', moderationV1Router);
apiV1Router.use('/posts', postsV1Router);
apiV1Router.use('/search', searchV1Router);
apiV1Router.use('/stories', storiesV1Router);
apiV1Router.use('/translation', translationV1Router);
apiV1Router.use('/users', usersV1Router);

module.exports = {
  apiV1Router,
};
