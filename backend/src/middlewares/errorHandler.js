const { logError } = require('../monitoring/logger');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.originalUrl} introuvable.`,
  });
}

function errorHandler(error, req, res, _next) {
  logError('unhandled_error', {
    method: req.method,
    path: req.originalUrl,
    error: error.message,
  });

  res.status(500).json({
    error: 'internal_server_error',
    message: 'Une erreur serveur est survenue.',
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
