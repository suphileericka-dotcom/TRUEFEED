# Beta, UX et stores S7/S8

## Beta privee

- Cohorte: 20 a 50 testeurs voyageurs.
- Acces: build iOS TestFlight + Android Internal Testing.
- Suivi: formulaire court apres session, canal direct pour bugs bloquants.
- Cadence: tri feedback 2 fois par semaine.
- Tags feedback: `bug`, `ux`, `contenu`, `performance`, `crash`.

## Scenarios UX

- Signup, login, logout.
- Lire feed, filtrer, ouvrir detail post.
- Publier un post texte/image/video.
- Liker, commenter, partager.
- Chercher un lieu ou un contenu.
- Creer/repondre/voter dans TrueDebate.
- Signaler un contenu.
- Tester empty states, erreurs reseau et retour navigation.

## Questionnaire beta

- Le premier ecran donne-t-il envie de continuer ?
- La navigation est-elle claire sans aide externe ?
- Le parcours de publication inspire-t-il confiance ?
- Les labels et messages d'erreur sont-ils comprehensibles ?
- Quelle action as-tu cherchee sans la trouver ?
- Quelle fonctionnalite garderais-tu absolument ?

## Assets stores

- Icone: `frontend/assets/images/icon.png`, 1024x1024.
- Android adaptive icon: foreground, background, monochrome.
- Splash: `frontend/assets/images/splash-icon.png`.
- Screenshots: feed, publish, post detail, search/explore, debate, profile.
- Bannieres: format App Store / Play Store, sans texte proche des bords.

## Checklist UX finale

- Contrastes verifies en themes clair/sombre/saisonnier.
- Boutons avec labels courts et etats disabled/loading.
- Empty states avec action suivante claire.
- Erreurs formulaire locales avant appel API.
- Navigation retour previsible depuis detail, auth et publication.
- Aucun texte ne deborde sur petits ecrans.
- Onboarding et placeholders relus sans jargon interne.
