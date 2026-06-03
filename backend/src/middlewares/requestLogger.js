const { logError, logInfo, logWarn } = require('../monitoring/logger');

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const payload = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    };

    if (res.statusCode >= 500) {
      logError('http_request_failed', payload);
      return;
    }

    if (res.statusCode >= 400) {
      logWarn('http_request_warning', payload);
      return;
    }

    logInfo('http_request', payload);
  });

  next();
}

module.exports = {
  requestLogger,
};
