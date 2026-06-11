// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const { postsService } = require('../../../services/posts.service');

const postsResolver = {
  createPostDraft(payload) {
    return postsService.createDraft(payload);
  },
};

module.exports = {
  postsResolver,
};
