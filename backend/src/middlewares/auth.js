const { authService } = require('../services/auth.service');
const { createHttpError } = require('../utils/httpError');

function getBearerToken(req) {
  const header = req.get('authorization') || '';

  if (!header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

function requireAuth(req, _res, next) {
  const token = getBearerToken(req);
  const user = token ? authService.getUserFromAccessToken(token) : null;

  if (!user) {
    next(createHttpError(401, 'unauthorized', 'Authentification requise.'));
    return;
  }

  req.user = user;
  next();
}

function requireRole(roles) {
  return function roleMiddleware(req, _res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      next(createHttpError(403, 'forbidden', 'Permission insuffisante.'));
      return;
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
