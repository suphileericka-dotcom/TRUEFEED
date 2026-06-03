# Observabilite et alertes S8

## Logs structures

- `http_request`: requetes 2xx/3xx.
- `http_request_warning`: requetes 4xx.
- `http_request_failed`: requetes 5xx, a brancher en alerte.
- `analytics_event`: signup, login, post_create, comment_create, like_toggle, share, search.
- `unhandled_error`: erreurs applicatives non gerees.

## Alertes minimales

- Healthcheck Railway: `/api/health`.
- Readiness: `/api/health/ready`.
- Alerte 5xx: plus de 5 erreurs sur 5 minutes.
- Alerte disponibilite: 2 healthchecks consecutifs en echec.
- Alerte latence: p95 API au-dessus de 1500 ms sur 10 minutes.

## Runbook incident

1. Verifier le dernier deploy Railway.
2. Lire les logs `http_request_failed` et `unhandled_error`.
3. Verifier Neon: connexions, stockage, migrations recentes.
4. Revenir au dernier deploy stable si l'incident est lie au release.
5. Noter cause, impact, correction et prevention dans le journal incident.
