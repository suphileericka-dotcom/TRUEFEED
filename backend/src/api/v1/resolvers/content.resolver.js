const { contentService } = require('../../../services/content.service');

const contentResolver = {
  feed() {
    return contentService.getFeed();
  },

  destinations() {
    return contentService.getDestinations();
  },

  debates() {
    return contentService.getDebates();
  },
};

module.exports = {
  contentResolver,
};
