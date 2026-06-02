# TRUEFEED Frontend Env Setup

## Environnements

Le frontend utilise trois environnements:

```txt
development -> API locale
staging     -> API de preproduction
production  -> API publique
```

Les variables exposees a Expo doivent commencer par `EXPO_PUBLIC_`.

## Fichiers

```txt
.env.development
.env.staging
.env.production
```

Les fichiers reels `.env*` restent ignores par Git. Les fichiers `.example` sont versionnes.

## Creation locale

Copier les exemples selon le besoin:

```bash
cp .env.development.example .env.development
cp .env.staging.example .env.staging
cp .env.production.example .env.production
```

## Scripts

```bash
npm run dev
npm run dev:web
npm run staging
npm run staging:web
npm run prod
npm run prod:web
```

## Variables disponibles

```txt
EXPO_PUBLIC_APP_ENV
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_APP_NAME
```

La config applicative est centralisee dans `constants/env.ts`.
