const crypto = require('crypto');

const { authConfig } = require('../config/auth');
const { createHttpError } = require('../utils/httpError');

const usersById = new Map();
const usersByEmail = new Map();
const usersByUsername = new Map();
const accessTokens = new Map();
const refreshTokens = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto
    .pbkdf2Sync(password, salt, authConfig.password.iterations, 64, 'sha512')
    .toString('hex');

  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, expectedHash] = passwordHash.split(':');
  const candidateHash = hashPassword(password, salt).split(':')[1];

  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(expectedHash, 'hex'),
  );
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function createSession(user) {
  const now = Date.now();
  const accessToken = createToken();
  const refreshToken = createToken();

  accessTokens.set(accessToken, {
    userId: user.id,
    expiresAt: now + authConfig.accessToken.expiresInMs,
  });
  refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: now + authConfig.refreshToken.expiresInMs,
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: Math.floor(authConfig.accessToken.expiresInMs / 1000),
  };
}

function register(payload) {
  const emailKey = payload.email.toLowerCase();
  const usernameKey = payload.username.toLowerCase();

  if (usersByEmail.has(emailKey)) {
    throw createHttpError(409, 'email_taken', 'Cet email est deja utilise.');
  }

  if (usersByUsername.has(usernameKey)) {
    throw createHttpError(409, 'username_taken', 'Ce nom utilisateur est deja utilise.');
  }

  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    username: payload.username,
    email: payload.email,
    displayName: payload.displayName,
    avatarUrl: payload.avatarUrl,
    bio: payload.bio,
    role: payload.role === 'admin' ? 'admin' : 'user',
    status: 'active',
    passwordHash: hashPassword(payload.password),
    createdAt: now,
    updatedAt: now,
  };

  usersById.set(user.id, user);
  usersByEmail.set(emailKey, user.id);
  usersByUsername.set(usernameKey, user.id);

  return {
    user: toPublicUser(user),
    session: createSession(user),
  };
}

function login({ email, password }) {
  const userId = usersByEmail.get(email.toLowerCase());
  const user = userId ? usersById.get(userId) : null;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createHttpError(401, 'invalid_credentials', 'Email ou mot de passe incorrect.');
  }

  if (user.status !== 'active') {
    throw createHttpError(403, 'user_inactive', 'Ce compte ne peut pas se connecter.');
  }

  return {
    user: toPublicUser(user),
    session: createSession(user),
  };
}

function refresh(refreshToken) {
  const session = refreshTokens.get(refreshToken);

  if (!session || session.expiresAt <= Date.now()) {
    refreshTokens.delete(refreshToken);
    throw createHttpError(401, 'invalid_refresh_token', 'Refresh token invalide ou expire.');
  }

  const user = usersById.get(session.userId);

  if (!user) {
    throw createHttpError(401, 'invalid_refresh_token', 'Refresh token invalide.');
  }

  refreshTokens.delete(refreshToken);

  return {
    user: toPublicUser(user),
    session: createSession(user),
  };
}

function logout(refreshToken) {
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
}

function getUserFromAccessToken(accessToken) {
  const session = accessTokens.get(accessToken);

  if (!session || session.expiresAt <= Date.now()) {
    accessTokens.delete(accessToken);
    return null;
  }

  const user = usersById.get(session.userId);
  return user ? toPublicUser(user) : null;
}

function updateProfile(userId, payload) {
  const user = usersById.get(userId);

  if (!user) {
    throw createHttpError(404, 'user_not_found', 'Utilisateur introuvable.');
  }

  const nextUser = {
    ...user,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  usersById.set(userId, nextUser);

  return toPublicUser(nextUser);
}

const authService = {
  getUserFromAccessToken,
  login,
  logout,
  refresh,
  register,
  updateProfile,
};

module.exports = {
  authService,
};
