# Backups et retention minimum

## Neon

- Activer PITR si disponible.
- Snapshot quotidien conserve 7 jours en staging.
- Snapshot quotidien conserve 30 jours en production.
- Export mensuel conserve 6 mois pour production.

## Media S3

- Versioning active sur bucket production.
- Lifecycle:
  - fichiers temporaires multipart expires apres 7 jours.
  - thumbnails regenerables conserves 90 jours.
  - originaux utilisateurs conserves tant que le post existe.

## Restauration

- Tester une restauration staging une fois par mois.
- Documenter: date backup, responsable, duree restauration, anomalies.
