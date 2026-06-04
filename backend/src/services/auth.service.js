const crypto = require('crypto');

const { authConfig } = require('../config/auth');
const { query } = require('../data/db');
const { createHttpError } = require('../utils/httpError');

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function signJwt(payload, expiresInMs) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: Math.floor((Date.now() + expiresInMs) / 1000),
  };
  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;
  const signature = crypto
    .createHmac('sha256', authConfig.accessToken.secret)
    .update(unsignedToken)
    .digest('base64url');

  return `${unsignedToken}.${signature}`;
}

function verifyJwt(token) {
  try {
    const [header, body, signature] = token.split('.');

    if (!header || !body || !signature) {
      return null;
    }

    const unsignedToken = `${header}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', authConfig.accessToken.secret)
      .update(unsignedToken)
      .digest('base64url');
    const signatureBuffer = Buffer.from(signature, 'base64url');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'base64url');

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      return null;
    }

    const payload = base64UrlDecode(body);

    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

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

function createRefreshToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHmac('sha256', authConfig.refreshToken.secret).update(token).digest('hex');
}

function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getRoleForEmail(email) {
  return getAdminEmails().includes(email.toLowerCase()) ? 'admin' : 'user';
}

async function createSession(user) {
  const refreshToken = createRefreshToken();
  const accessToken = signJwt(
    {
      sub: user.id,
      role: user.role,
    },
    authConfig.accessToken.expiresInMs,
  );
  const expiresAt = new Date(Date.now() + authConfig.refreshToken.expiresInMs);

  await query(
    `INSERT INTO refresh_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, hashToken(refreshToken), expiresAt],
  );

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: Math.floor(authConfig.accessToken.expiresInMs / 1000),
  };
}

async function register(payload) {
  const existing = await query(
    `SELECT id, email, username
     FROM users
     WHERE lower(email) = lower($1) OR lower(username) = lower($2)
     LIMIT 1`,
    [payload.email, payload.username],
  );

  if (existing.rowCount > 0) {
    const row = existing.rows[0];

    if (row.email.toLowerCase() === payload.email.toLowerCase()) {
      throw createHttpError(409, 'email_taken', 'Cet email est deja utilise.');
    }

    if (row.username.toLowerCase() === payload.username.toLowerCase()) {
      throw createHttpError(409, 'username_taken', 'Ce nom utilisateur est deja utilise.');
    }
  }

  const result = await query(
    `INSERT INTO users (
       username,
       email,
       display_name,
       avatar_url,
       bio,
       password_hash,
       role
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      payload.username,
      payload.email,
      payload.displayName,
      payload.avatarUrl || null,
      payload.bio || null,
      hashPassword(payload.password),
      getRoleForEmail(payload.email),
    ],
  );
  const user = toPublicUser(result.rows[0]);

  return {
    user,
    session: await createSession(user),
  };
}

async function login({ email, password }) {
  const result = await query(
    `SELECT *
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );
  const row = result.rows[0];

  if (!row || !verifyPassword(password, row.password_hash)) {
    throw createHttpError(401, 'invalid_credentials', 'Email ou mot de passe incorrect.');
  }

  if (row.status !== 'active') {
    throw createHttpError(403, 'user_inactive', 'Ce compte ne peut pas se connecter.');
  }

  let userRow = row;
  const expectedRole = getRoleForEmail(row.email);

  if (expectedRole !== row.role) {
    const promoted = await query(
      `UPDATE users
       SET role = $2, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [row.id, expectedRole],
    );
    userRow = promoted.rows[0];
  }

  const user = toPublicUser(userRow);

  return {
    user,
    session: await createSession(user),
  };
}

async function refresh(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const sessionResult = await query(
    `SELECT refresh_sessions.id AS session_id, users.*
     FROM refresh_sessions
     INNER JOIN users ON users.id = refresh_sessions.user_id
     WHERE refresh_sessions.token_hash = $1
       AND refresh_sessions.revoked_at IS NULL
       AND refresh_sessions.expires_at > now()
       AND users.status = 'active'
     LIMIT 1`,
    [tokenHash],
  );
  const row = sessionResult.rows[0];

  if (!row) {
    throw createHttpError(401, 'invalid_refresh_token', 'Refresh token invalide ou expire.');
  }

  await query(`UPDATE refresh_sessions SET revoked_at = now() WHERE id = $1`, [row.session_id]);

  const user = toPublicUser(row);

  return {
    user,
    session: await createSession(user),
  };
}

async function logout(refreshToken) {
  if (!refreshToken) {
    return;
  }

  await query(`UPDATE refresh_sessions SET revoked_at = now() WHERE token_hash = $1`, [
    hashToken(refreshToken),
  ]);
}

async function getUserFromAccessToken(accessToken) {
  const payload = verifyJwt(accessToken);

  if (!payload?.sub) {
    return null;
  }

  const result = await query(
    `SELECT *
     FROM users
     WHERE id = $1 AND status = 'active'
     LIMIT 1`,
    [payload.sub],
  );

  return result.rows[0] ? toPublicUser(result.rows[0]) : null;
}

async function updateProfile(userId, payload) {
  const result = await query(
    `UPDATE users
     SET display_name = COALESCE($2, display_name),
         avatar_url = COALESCE($3, avatar_url),
         bio = COALESCE($4, bio),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [userId, payload.displayName || null, payload.avatarUrl || null, payload.bio || null],
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, 'user_not_found', 'Utilisateur introuvable.');
  }

  return toPublicUser(result.rows[0]);
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
