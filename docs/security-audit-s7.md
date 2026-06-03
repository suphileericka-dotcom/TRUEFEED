# Audit securite rapide S7

- CORS strict via `CLIENT_ORIGINS`; eviter `*` en production.
- Headers basiques: nosniff, frame deny, referrer policy, permissions policy.
- JSON body limite a `1mb`.
- Rate-limit login active.
- Secrets JWT obligatoires en staging/prod.
- Refresh tokens opaques cote API prototype; persistance DB prevue via `refresh_sessions`.
- Moderation v1: report + auto-flag par termes simples.
- Logs structures JSON pour requetes, erreurs et analytics.
- Backend audit prod: 0 vulnerabilite connue apres `npm audit fix`.
- Frontend audit prod: alertes moderees dans la chaine Expo 54 (`postcss`, `uuid` via Expo CLI/config). `npm audit fix --force` propose Expo 56, donc migration majeure a planifier et tester au lieu de forcer en S7.

## A faire avant prod stricte

- Remplacer stores memoire par PostgreSQL.
- Ajouter rotation refresh tokens persistante.
- Ajouter tests d'integration API.
- Brancher alerting externe sur healthcheck et taux 5xx.
- Planifier upgrade Expo SDK 56 quand la compatibilite mobile est validee.
