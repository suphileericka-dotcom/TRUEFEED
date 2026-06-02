# TRUEFEED S7/S8 Release Ops

## Beta privee

- Cohorte initiale: 20 a 50 utilisateurs voyageurs.
- Canal retour: formulaire court apres session + canal direct pour bugs bloquants.
- Cadence: revue feedback 2 fois par semaine, tri en `bug`, `ux`, `contenu`, `performance`.
- KPI beta: signup, activation profil, creation post, like/comment, recherche, ajout BonPlan.

## Plan test UX

- Scenario 1: creer un compte puis changer de theme sur l'accueil.
- Scenario 2: filtrer le feed par tag, liker, commenter, partager.
- Scenario 3: ouvrir un detail post et poster un commentaire.
- Scenario 4: creer un BonPlan avec categorie et budget.
- Scenario 5: explorer la carte, ouvrir une fiche lieu.
- Scenario 6: rejoindre un TrueDebate, voter, repondre.

Questions:
- La navigation est-elle claire sans explication externe ?
- Les empty states donnent-ils une action utile ?
- Les couleurs restent-elles lisibles dans chaque theme ?
- Le parcours de publication inspire-t-il confiance ?

## Assets stores

- Icone app: version 1024x1024.
- Banniere: 2732x2048, sans texte trop proche des bords.
- Screenshots: feed, publication, MapExplorer, TrueDebate, profil.
- Texte court: "TRUEFEED aide les voyageurs a publier, debattre et trouver des BonPlans saisonniers."

## Kit contenu

- Onboarding 1: "Choisis ton ambiance saisonniere."
- Onboarding 2: "Publie un spot, un vlog ou un debat."
- Onboarding 3: "Explore les BonPlans proches."
- Placeholder feed: "Aucun post pour ce filtre. Essaie un autre tag."
- Placeholder map: "Aucun lieu proche. Elargis le rayon."

## Checklist UX finale

- Labels courts sur boutons.
- Contrastes verifies sur les quatre themes.
- Actions destructives confirmees par modal.
- Auth accessible depuis les zones de contribution.
- Empty/loading/error/offline presents sur les surfaces data.
- Formulaires avec validation locale et message clair.
