# Deploiement Staging / Production

## Backend Railway

- Root directory: `backend`.
- Builder: `DOCKERFILE` (`backend/Dockerfile`).
- Start: `npm start`.
- Healthcheck: `/api/health`.
- Readiness: `/api/health/ready`.
- Variables minimales:
  - `NODE_ENV=production`
  - `PORT=4000`
  - `CLIENT_ORIGINS=https://staging.truefeed.app,https://truefeed.app`
  - `TRUST_PROXY=true`
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `AWS_REGION`
  - `S3_BUCKET`
  - `S3_PUBLIC_BASE_URL`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
- L'API refuse de demarrer en staging/prod si les secrets JWT manquent ou si CORS vaut `*`.

## Database Neon

- Appliquer `backend/migrations/001_truefeed_schema.sql`.
- Le fichier est idempotent pour les types, tables, index et triggers.
- Toute la structure PostgreSQL doit rester dans ce fichier unique.
- Les compteurs denormalises sont maintenus par triggers:
  - `likes` -> `posts.likes_count`.
  - `comments` publies -> `posts.comments_count`.
  - `post_shares` -> `posts.shares_count`.
  - `debate_votes` -> `debate_threads.up_votes` / `down_votes`.
  - `debate_replies` -> `debate_threads.replies_count`.
- `001_truefeed_schema.sql` recalcule aussi les compteurs existants apres creation/remplacement des triggers.

## Frontend Vercel / Expo Web

- Root directory: `frontend`.
- Build command: `npm ci && npm run build:web`.
- Output: `dist`.
- Variables:
  - `EXPO_PUBLIC_APP_ENV=staging` ou `production`
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_APP_NAME`

## Builds mobiles internes

- iOS TestFlight/interne: `npm run build:ios:internal`.
- Android Internal Testing: `npm run build:android:internal`.
- Profils EAS: `frontend/eas.json`.
- Identifiants app:
  - iOS bundle id: `app.truefeed.mobile`
  - Android package: `app.truefeed.mobile`

## Environnements

- Staging: donnees jetables, logs verbeux, alertes faibles.
- Production: secrets separes, CORS strict, backup active, alertes healthcheck.
