# Deploiement Staging / Production

## Backend Railway

- Root directory: `backend`.
- Build: `npm ci`.
- Start: `npm start`.
- Healthcheck: `/api/health`.
- Variables minimales:
  - `NODE_ENV=production`
  - `PORT=4000`
  - `CLIENT_ORIGINS=https://staging.truefeed.app,https://truefeed.app`
  - `TRUST_PROXY=true`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`

## Database Neon

- Appliquer `backend/migrations/001_truefeed_schema.sql`.
- Le fichier est idempotent pour les types et index.
- Les compteurs denormalises sont maintenus par triggers.

## Frontend Vercel / Expo Web

- Root directory: `frontend`.
- Build command: `npm ci && npx expo export --platform web`.
- Output: `dist`.

## Environnements

- Staging: donnees jetables, logs verbeux, alertes faibles.
- Production: secrets separes, CORS strict, backup active, alertes healthcheck.
