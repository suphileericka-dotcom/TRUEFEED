# TRUEFEED Code Conventions

## Formatting

- Prettier est la source de verite pour le formatage.
- Indentation: 2 espaces.
- Quotes: simples.
- Point-virgule: oui.
- Largeur cible: 100 caracteres.

## JavaScript / TypeScript

- Preferer les modules petits: routes, services, config, constants.
- Nommer les services en `*.service.js`.
- Nommer les routes backend en `*.routes.js`.
- Garder les variables d'environnement dans des modules `config`.
- Cote frontend, exposer uniquement les variables Expo prefixees `EXPO_PUBLIC_`.

## Scripts

Frontend:

```bash
npm run lint
npm run format
npm run format:check
```

Backend:

```bash
npm run lint
npm run format
npm run format:check
```
