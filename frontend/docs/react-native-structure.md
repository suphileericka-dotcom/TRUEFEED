# TRUEFEED React Native Structure

## Structure cible

```txt
app/                 Routes Expo Router
assets/              Images et assets statiques
components/          Composants UI reutilisables
components/truefeed/ Composants metier TRUEFEED
constants/           Constantes globales et config publique
features/            Modules fonctionnels par domaine
hooks/               Hooks reutilisables
lib/                 Helpers techniques
services/            Clients API, monitoring, storage
types/               Types partages de l'app
```

## Alias

L'alias principal est deja actif dans `tsconfig.json`:

```txt
@/* -> ./*
```

Exemples:

```ts
import { env } from '@/constants/env';
import { apiClient } from '@/services/api/client';
import { trackEvent } from '@/services/monitoring';
```

## Conventions

- Les ecrans restent dans `app/`.
- La logique d'appel API reste dans `services/api`.
- Les modules produit vont dans `features/<domain>`.
- Les types globaux vont dans `types`.
- Les helpers sans etat vont dans `lib`.
