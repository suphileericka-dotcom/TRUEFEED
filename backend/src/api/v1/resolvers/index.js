const { contentResolver } = require('./content.resolver');
const { mediaResolver } = require('./media.resolver');
const { postsResolver } = require('./posts.resolver');

const resolvers = {
  content: contentResolver,
  media: mediaResolver,
  posts: postsResolver,
};

module.exports = {
  resolvers,
};
