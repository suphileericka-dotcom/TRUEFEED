// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
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
