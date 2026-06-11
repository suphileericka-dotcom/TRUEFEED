// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const { logError } = require('../monitoring/logger');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.originalUrl} introuvable.`,
  });
}

function errorHandler(error, req, res, _next) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      error: 'media_too_large',
      message: 'Le media est trop volumineux.',
    });
    return;
  }

  if (error.statusCode) {
    res.status(error.statusCode).json({
      error: error.error || 'request_error',
      message: error.message,
      details: error.details,
    });
    return;
  }

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
