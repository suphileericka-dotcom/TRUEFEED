const { postsService } = require('../../../services/posts.service');

const postsResolver = {
  createPostDraft(payload) {
    return postsService.createDraft(payload);
  },
};

module.exports = {
  postsResolver,
};
