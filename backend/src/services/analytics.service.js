const { logInfo } = require('../monitoring/logger');

function track(event, properties = {}) {
  logInfo('analytics_event', {
    event,
    properties,
  });
}

module.exports = {
  analyticsService: {
    track,
  },
};
