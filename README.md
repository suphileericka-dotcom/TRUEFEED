# TRUEFEED

TRUEFEED est un monorepo mobile + API organise pour que chacun travaille dans son espace sans se marcher dessus.

## Structure

```text
TRUEFEED/
├── backend/   # Ayessa : API Node.js / Express
├── frontend/  # Suphile : app mobile React Native / Expo
└── README.md  # documentation rapide du projet
```

## Stack technique

- Frontend : React Native avec Expo Router
- Backend : Node.js avec Express
- Base de donnees cible : MongoDB ou PostgreSQL
- Design : titres en esprit Georgia, corps en esprit Calibri
- Outil de suivi conseille : Notion

## Demarrage rapide

### Frontend

```bash
cd frontend
npm start
```

Puis :

- `a` pour Android
- `w` pour la version web
- `i` pour iOS via macOS / simulateur compatible

### Backend

```bash
cd backend
npm run dev
```

API disponible par defaut sur `http://localhost:4000`.

## Fonctionnalites deja posees

- Monorepo `frontend/` + `backend/`
- Base Expo prete pour l'app mobile
- Base Express prete pour l'API
- Interfaces visuelles initiales pour :
  - Feed principal
  - Fiche destination
  - Explore hivernal
  - TrueDebate
  - Page de publication
- Mock routes backend pour faciliter le branchement frontend plus tard

## Repartition sur 8 semaines

| Membre | Focus principal | Livrables cles |
| --- | --- | --- |
| Suphile | UI / UX / Mobile | SeasonMode, page publication, VlogFeed |
| Ayessa | Backend / API | CRUD, base de donnees, authentification |

## Notes techniques

- `SeasonMode` doit detecter la date systeme pour choisir le theme de saison par defaut.
- Le stockage video peut partir sur AWS S3 lorsque la partie upload sera connectee.
- La route `POST /api/posts` du backend est prete pour brancher la page de publication.
