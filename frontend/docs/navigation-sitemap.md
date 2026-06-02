# TRUEFEED Navigation Sitemap

## Structure Expo Router cible

```txt
app/
  _layout.tsx
  modal.tsx
  (auth)/
    login.tsx
    register.tsx
    forgot-password.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    bonplan.tsx
    publish.tsx
    explore.tsx
    debate.tsx
  post/
    [id].tsx
  destination/
    [id].tsx
  profile/
    [id].tsx
    edit.tsx
  settings/
    index.tsx
  moderation/
    reports.tsx
```

## Navigation principale

| Route             | Ecran                  | Type        | Statut   |
| ----------------- | ---------------------- | ----------- | -------- |
| `/(tabs)`         | Tabs principales       | Tabs        | existant |
| `/(tabs)/index`   | Accueil / Feed         | Tab         | existant |
| `/(tabs)/bonplan` | Bons plans / Recherche | Tab         | existant |
| `/(tabs)/publish` | Publier                | Tab         | existant |
| `/(tabs)/explore` | Explore destinations   | Tab         | existant |
| `/(tabs)/debate`  | TrueDebate             | Tab         | existant |
| `/modal`          | Modal generique        | Stack modal | existant |

## Navigation Auth cible

| Route                     | Ecran               | Acces  |
| ------------------------- | ------------------- | ------ |
| `/(auth)/login`           | Connexion           | public |
| `/(auth)/register`        | Inscription         | public |
| `/(auth)/forgot-password` | Mot de passe oublie | public |

## Navigation detail cible

| Route                 | Ecran              | Acces                         |
| --------------------- | ------------------ | ----------------------------- |
| `/post/[id]`          | Detail publication | public/connecte selon contenu |
| `/destination/[id]`   | Detail destination | public                        |
| `/profile/[id]`       | Profil utilisateur | public/connecte selon profil  |
| `/profile/edit`       | Edition profil     | connecte                      |
| `/settings`           | Reglages compte    | connecte                      |
| `/moderation/reports` | Moderation reports | moderator/admin               |

## Guard de session

- Public: auth, feed public, explore, details publics.
- Connecte: publish, profil edit, settings, likes/commentaires/reports.
- Moderator/admin: moderation.
- Au demarrage: tenter `POST /api/auth/refresh`, puis router vers tabs si la session existe.
