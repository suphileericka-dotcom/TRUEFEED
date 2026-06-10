const crypto = require('crypto');

const { authConfig } = require('../config/auth');
const { query, transaction } = require('../data/db');
const { mailService } = require('./mail.service');
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

function hashVerificationCode(code) {
  return crypto.createHmac('sha256', authConfig.refreshToken.secret).update(code).digest('hex');
}

function createEmailToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function getAppUrl() {
  const origin = process.env.APP_URL || process.env.CLIENT_ORIGIN;

  if (origin && origin !== '*') {
    return origin.replace(/\/$/, '');
  }

  return 'http://localhost:8081';
}

function createAppLink(path, params) {
  const url = new URL(path, getAppUrl());

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createActionEmail({ title, preview, body, buttonLabel, actionUrl, footer }) {
  const safeTitle = escapeHtml(title);
  const safePreview = escapeHtml(preview);
  const safeBody = escapeHtml(body);
  const safeButtonLabel = escapeHtml(buttonLabel);
  const safeActionUrl = escapeHtml(actionUrl);
  const safeFooter = escapeHtml(footer || 'Si tu n es pas a l origine de cette action, ignore cet email.');

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${safeTitle}</title>
      </head>
      <body style="margin:0;background:#f6f3ee;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
        <div style="display:none;max-height:0;overflow:hidden;">${safePreview}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ee;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #eadfd1;border-radius:22px;overflow:hidden;">
                <tr>
                  <td style="background:#f97316;padding:26px 28px;text-align:center;">
                    <div style="font-size:13px;font-weight:800;letter-spacing:0;text-transform:uppercase;color:#fff7ed;">TRUEFEED</div>
                    <h1 style="margin:10px 0 0;font-size:30px;line-height:1.15;color:#ffffff;">${safeTitle}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 22px;font-size:16px;line-height:1.55;color:#475467;">${safeBody}</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 22px;">
                      <tr>
                        <td style="border-radius:14px;background:#111827;">
                          <a href="${safeActionUrl}" style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;">${safeButtonLabel}</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#667085;">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :</p>
                    <p style="margin:0;word-break:break-all;font-size:13px;line-height:1.5;color:#2563eb;">${safeActionUrl}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px;background:#fff7ed;border-top:1px solid #eadfd1;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#7c2d12;">${safeFooter}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function createConfirmationEmail(link) {
  return {
    subject: 'Confirme ton compte TRUEFEED',
    text: `Bienvenue sur TRUEFEED. Confirme ton adresse email avec ce lien valable 24 heures: ${link}`,
    html: createActionEmail({
      title: 'Confirme ton compte',
      preview: 'Ton lien de confirmation TRUEFEED est valable 24 heures.',
      body: 'Bienvenue sur TRUEFEED. Confirme ton adresse email pour finaliser la securite de ton compte.',
      buttonLabel: 'Confirmer mon email',
      actionUrl: link,
      footer: 'Ce lien expire dans 24 heures.',
    }),
  };
}

function createPasswordResetEmail(link) {
  return {
    subject: 'Reinitialise ton mot de passe TRUEFEED',
    text: `Tu peux reinitialiser ton mot de passe avec ce lien valable 1 heure: ${link}`,
    html: createActionEmail({
      title: 'Reinitialise ton mot de passe',
      preview: 'Ton lien de reinitialisation TRUEFEED est valable 1 heure.',
      body: 'Tu as demande a reinitialiser ton mot de passe. Utilise ce lien pour en choisir un nouveau.',
      buttonLabel: 'Choisir un nouveau mot de passe',
      actionUrl: link,
      footer: 'Ce lien expire dans 1 heure. Ignore cet email si tu n as rien demande.',
    }),
  };
}

function createPasswordChangedEmail() {
  return {
    subject: 'Mot de passe TRUEFEED modifie',
    text: 'Ton mot de passe TRUEFEED vient d etre modifie. Si tu n es pas a l origine de cette action, contacte le support.',
    html: createActionEmail({
      title: 'Mot de passe modifie',
      preview: 'Ton mot de passe TRUEFEED a bien ete modifie.',
      body: 'Ton mot de passe TRUEFEED vient d etre modifie avec succes.',
      buttonLabel: 'Ouvrir TRUEFEED',
      actionUrl: getAppUrl(),
      footer: 'Si tu n es pas a l origine de cette action, contacte le support immediatement.',
    }),
  };
}

function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    language: row.language || 'fr',
    role: row.role,
    status: row.status,
    emailVerifiedAt: row.email_verified_at,
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

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
}

function slugifyUsername(value) {
  const slug = normalizeUsername(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._]+/g, '')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 24);

  return slug.length >= 3 ? slug : `user${crypto.randomInt(1000, 9999)}`;
}

function assertValidUsername(username) {
  if (!/^[a-z0-9._]{3,32}$/.test(username)) {
    throw createHttpError(
      400,
      'invalid_username',
      'Nom utilisateur invalide: lettres, chiffres, point ou tiret bas uniquement.',
    );
  }
}

async function createAvailableUsername(baseValue, { excludeUserId } = {}) {
  const base = slugifyUsername(baseValue);

  for (let index = 0; index < 20; index += 1) {
    const suffix = index === 0 ? '' : String(index + 1);
    const candidate = `${base}${suffix}`.slice(0, 32);
    const params = [candidate];
    const excludeSql = excludeUserId ? 'AND id <> $2' : '';

    if (excludeUserId) {
      params.push(excludeUserId);
    }

    const existing = await query(
      `SELECT id FROM users WHERE lower(username) = lower($1) ${excludeSql} LIMIT 1`,
      params,
    );

    if (existing.rowCount === 0) {
      return candidate;
    }
  }

  return `${base.slice(0, 24)}${crypto.randomInt(100000, 999999)}`;
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
  const email = String(payload.email || '').trim().toLowerCase();
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const displayName = `${firstName} ${lastName}`.trim();

  if (displayName.length < 2) {
    throw createHttpError(400, 'invalid_display_name', 'Prenom et nom requis.');
  }

  const existing = await query(
    `SELECT id, email
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );

  if (existing.rowCount > 0) {
    const row = existing.rows[0];

    if (row.email.toLowerCase() === email) {
      throw createHttpError(409, 'email_taken', 'Cet email est deja utilise.');
    }
  }

  const verificationToken = createEmailToken();
  const username = await createAvailableUsername(`tmp_${firstName}_${crypto.randomInt(1000, 9999)}`);
  const user = await transaction(async (client) => {
    const result = await client.query(
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
        username,
        email,
        displayName,
        payload.avatarUrl || null,
        payload.bio || null,
        hashPassword(payload.password),
        getRoleForEmail(email),
      ],
    );
    const createdUser = toPublicUser(result.rows[0]);

    await client.query(
      `INSERT INTO user_gifts (user_id, gift_number, stock)
       VALUES ($1, 15, 1)
       ON CONFLICT DO NOTHING`,
      [createdUser.id],
    );

    await client.query(
      `INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
       VALUES ($1, $2, now() + interval '24 hours')`,
      [createdUser.id, hashVerificationCode(verificationToken)],
    );

    return createdUser;
  });

  await mailService.sendMail({
    to: user.email,
    ...createConfirmationEmail(createAppLink('/verify-email', { token: verificationToken })),
  });

  return {
    user,
    session: await createSession(user),
    emailVerificationRequired: true,
  };
}

async function verifyEmail({ email, code }) {
  const token = String(code || '').trim();
  const params = email ? [email, hashVerificationCode(token)] : [hashVerificationCode(token)];
  const where = email
    ? 'lower(users.email) = lower($1) AND email_verification_codes.code_hash = $2'
    : 'email_verification_codes.code_hash = $1';
  const result = await query(
    `SELECT users.*, email_verification_codes.id AS code_id
     FROM users
     INNER JOIN email_verification_codes ON email_verification_codes.user_id = users.id
     WHERE ${where}
       AND email_verification_codes.used_at IS NULL
       AND email_verification_codes.expires_at > now()
     ORDER BY email_verification_codes.created_at DESC
     LIMIT 1`,
    params,
  );
  const row = result.rows[0];

  if (!row) {
    throw createHttpError(400, 'invalid_verification_link', 'Lien de verification invalide ou expire.');
  }

  const updatedUser = await transaction(async (client) => {
    await client.query(`UPDATE email_verification_codes SET used_at = now() WHERE id = $1`, [
      row.code_id,
    ]);
    const updated = await client.query(
      `UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
      [row.id],
    );

    return toPublicUser(updated.rows[0]);
  });

  return { verified: true, user: updatedUser };
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

async function requestPasswordReset({ email }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const result = await query(
    `SELECT * FROM users WHERE lower(email) = lower($1) AND status = 'active' LIMIT 1`,
    [cleanEmail],
  );
  const row = result.rows[0];

  if (!row) {
    return { sent: true };
  }

  const token = createEmailToken();

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '1 hour')`,
    [row.id, hashVerificationCode(token)],
  );

  await mailService.sendMail({
    to: row.email,
    ...createPasswordResetEmail(createAppLink('/reset-password', { token })),
  });

  return { sent: true };
}

async function resetPassword({ token, password }) {
  const tokenHash = hashVerificationCode(String(token || '').trim());
  const result = await query(
    `SELECT password_reset_tokens.id AS token_id, users.*
     FROM password_reset_tokens
     INNER JOIN users ON users.id = password_reset_tokens.user_id
     WHERE password_reset_tokens.token_hash = $1
       AND password_reset_tokens.used_at IS NULL
       AND password_reset_tokens.expires_at > now()
       AND users.status = 'active'
     LIMIT 1`,
    [tokenHash],
  );
  const row = result.rows[0];

  if (!row) {
    throw createHttpError(400, 'invalid_reset_link', 'Lien de reinitialisation invalide ou expire.');
  }

  await transaction(async (client) => {
    await client.query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`, [
      row.token_id,
    ]);
    await client.query(
      `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`,
      [row.id, hashPassword(password)],
    );
  });

  return { reset: true };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const result = await query(`SELECT * FROM users WHERE id = $1 AND status = 'active' LIMIT 1`, [
    userId,
  ]);
  const row = result.rows[0];

  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    throw createHttpError(400, 'invalid_current_password', 'Mot de passe actuel incorrect.');
  }

  await query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [
    userId,
    hashPassword(newPassword),
  ]);

  await mailService.sendMail({
    to: row.email,
    ...createPasswordChangedEmail(),
  });

  return { changed: true };
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
         language = COALESCE($5, language),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      userId,
      payload.displayName || null,
      payload.avatarUrl || null,
      payload.bio || null,
      payload.language || null,
    ],
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, 'user_not_found', 'Utilisateur introuvable.');
  }

  return toPublicUser(result.rows[0]);
}

async function completeUsername(userId, payload) {
  const requestedUsername = normalizeUsername(payload.username);
  const username = requestedUsername || (await createAvailableUsername(payload.firstName, { excludeUserId: userId }));

  assertValidUsername(username);

  const existing = await query(
    `SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2 LIMIT 1`,
    [username, userId],
  );

  if (existing.rowCount > 0) {
    throw createHttpError(409, 'username_taken', 'Ce nom utilisateur est deja utilise.');
  }

  const result = await query(
    `UPDATE users
     SET username = $2,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [userId, username],
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, 'user_not_found', 'Utilisateur introuvable.');
  }

  return { user: toPublicUser(result.rows[0]) };
}

const authService = {
  changePassword,
  completeUsername,
  getUserFromAccessToken,
  login,
  logout,
  refresh,
  register,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  verifyEmail,
};

module.exports = {
  authService,
};
