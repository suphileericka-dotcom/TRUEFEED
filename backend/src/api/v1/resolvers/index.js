// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
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
