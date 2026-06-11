// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
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
