# Audit securite rapide S7

- CORS strict via `CLIENT_ORIGINS`; eviter `*` en production.
- Headers basiques: nosniff, frame deny, referrer policy, permissions policy.
- JSON body limite a `1mb`.
- Rate-limit login active.
- Secrets JWT obligatoires en staging/prod.
- Refresh tokens opaques cote API prototype; persistance DB prevue via `refresh_sessions`.
- Moderation v1: report + auto-flag par termes simples.
- Logs structures JSON pour requetes, erreurs et analytics.

## A faire avant prod stricte

- Remplacer stores memoire par PostgreSQL.
- Ajouter rotation refresh tokens persistante.
- Ajouter tests d'integration API.
- Brancher alerting externe sur healthcheck et taux 5xx.
