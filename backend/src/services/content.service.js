const { debates, destinations, feed } = require('../data/mockData');

const contentService = {
  getFeed() {
    return feed;
  },

  getDestinations() {
    return destinations;
  },

  getDebates() {
    return debates;
  },
};

module.exports = {
  contentService,
};
