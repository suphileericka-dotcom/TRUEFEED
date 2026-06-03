# TRUEFEED Auth Strategy

## Stack cible

- Authentification: email + mot de passe au depart, OAuth possible plus tard.
- Session API: JWT access token court + refresh token long.
- Hash password: PBKDF2 via `crypto`.
- Signature JWT: HMAC SHA-256 via `crypto`.
- Stockage refresh token: base de donnees, version hashee, avec rotation.
- Transport access token: header `Authorization: Bearer <token>`.
- Transport refresh token MVP: body JSON. Cible prod stricte: cookie `httpOnly`, `secure`, `sameSite=lax`.

## Durees

- Access token: 15 minutes.
- Refresh token: 30 jours.
- Rotation: un refresh token consomme est remplace par un nouveau.
- Reuse detection: si un ancien refresh token reutilise est detecte, revoquer la famille de session.

## Claims JWT

```json
{
  "sub": "user-id",
  "role": "user",
  "iat": 1710000000,
  "exp": 1710000900
}
```

## Endpoints Auth

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/users/me
```

## Strategie backend

- `register`: creer le user, hasher le password, ouvrir une session.
- `login`: verifier credentials, creer access token + refresh token.
- `refresh`: verifier le hash du refresh token stocke, revoquer l'ancien token, creer une nouvelle session.
- `logout`: revoquer la session courante et supprimer le cookie refresh.
- `me`: lire le user depuis l'access token.

## Strategie frontend

- Garder l'access token en memoire applicative.
- Ne pas stocker le refresh token en JS si le backend utilise un cookie `httpOnly`.
- Au lancement de l'app, appeler `POST /api/auth/refresh` pour restaurer la session.
- Sur `401`, tenter un refresh une seule fois, puis rejouer la requete initiale.
- Si le refresh echoue, rediriger vers `/(auth)/login`.

## Roles

- `user`: publication, commentaires, likes, reports.
- `moderator`: lecture moderation, action sur reports.
- `admin`: gestion globale utilisateurs, moderation et configuration.

## Variables d'environnement

```txt
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
DATABASE_URL=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
REFRESH_COOKIE_NAME=truefeed_refresh
```
