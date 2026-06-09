# Fiche technique - Corrections TRUEFEED

Date de reference: 8 juin 2026
Branche: `main`
Commits principaux:
- `e5297eb` - correction auth, CORS, cadeaux, badges, commentaires, republications.
- `94a0f3c` - refonte du flux Publish.
- `754bd3a` - correction du `typecheck` frontend qui cassait la CI.

## Objectif

Cette fiche explique comment les problemes principaux du site ont ete resolus, quels fichiers ont ete modifies, et comment lire les parties importantes du code.

Le principe general a ete de corriger les vrais blocages techniques cote backend, puis d'aligner les ecrans frontend avec les workflows attendus:
- inscription et connexion utilisables depuis Vercel;
- messages d'erreur comprehensibles;
- verification email par code;
- publication routee vers la bonne page;
- Bon Plan nettoye;
- cadeaux et badges rendus moins fictifs;
- commentaires et republications mieux controles;
- CI frontend reparee.

## 1. Probleme CORS inscription/connexion

### Symptome

Le navigateur bloquait l'inscription:

```text
No 'Access-Control-Allow-Origin' header is present
POST /api/v1/auth/register net::ERR_FAILED
```

### Cause

Le backend Railway refusait l'origine Vercel de preview:

```text
https://truefeed-65tmphutj-suphileericka-dotcoms-projects.vercel.app
```

Le CORS acceptait seulement les origines listees dans `CLIENT_ORIGINS`.

### Correction

Fichiers:
- `backend/src/app.js`
- `backend/src/config/env.js`

Le backend accepte maintenant:
- les origines explicites configurees;
- les previews Vercel du projet TRUEFEED;
- `*` seulement hors production.

Lecture commentee:

```js
function isAllowedOrigin(origin) {
  // Les appels serveur a serveur ou mobile natif n'ont parfois pas d'origine.
  // On les laisse passer.
  if (!origin || env.clientOrigins.includes(origin)) {
    return true;
  }

  // En developpement seulement, on autorise le wildcard.
  // En production, il faut une origine connue ou un domaine Vercel valide.
  if (env.clientOrigins.includes('*') && env.nodeEnv !== 'production') {
    return true;
  }

  // On analyse l'URL pour verifier protocole + hostname.
  // En production, pas de HTTP simple.
  const { hostname, protocol } = new URL(origin);

  if (protocol !== 'https:' && env.nodeEnv !== 'development') {
    return false;
  }

  // Autorise les domaines Vercel TRUEFEED et les previews du projet.
  return env.vercelProjectHostPatterns.some((pattern) => pattern.test(hostname));
}
```

## 2. Inscription: username deja pris et email deja pris

### Probleme

L'utilisateur avait un message trop vague:

```text
Impossible de creer le compte avec ces informations.
```

### Correction

Fichiers:
- `backend/src/services/auth.service.js`
- `frontend/app/(auth)/signup.tsx`
- `frontend/services/api/client.ts`

Backend:
- normalise `username` et `email`;
- refuse les usernames invalides;
- renvoie `username_taken` ou `email_taken`.

Frontend:
- intercepte `ApiError`;
- affiche un message precis:
  - `Ce nom utilisateur est deja pris. Choisis un autre nom.`
  - `Cet email a deja un compte. Connecte-toi ou utilise un autre email.`

Lecture commentee:

```ts
if (error instanceof ApiError && error.code === 'username_taken') {
  setStatus('Ce nom utilisateur est deja pris. Choisis un autre nom.');
  return;
}
```

Ce bloc transforme une erreur technique backend en phrase utile pour l'utilisateur.

## 3. Verification email par code

### Objectif

Ajouter un code de securite envoye par email pendant la creation de compte.

### Correction

Fichiers:
- `backend/src/services/auth.service.js`
- `backend/src/services/mail.service.js`
- `backend/src/api/v1/routes/auth.routes.js`
- `backend/migrations/001_truefeed_schema.sql`
- `frontend/app/(auth)/signup.tsx`
- `frontend/services/api/auth.ts`

### Fonctionnement

1. L'utilisateur cree son compte.
2. Le backend genere un code a 6 chiffres.
3. Le code est stocke sous forme hashee, jamais en clair.
4. Le backend envoie le code par email si `RESEND_API_KEY` est configure.
5. L'utilisateur entre le code.
6. Le backend marque `email_verified_at`.

Lecture commentee:

```js
const verificationCode = String(crypto.randomInt(100000, 999999));
```

Genere un code a 6 chiffres.

```js
hashVerificationCode(verificationCode)
```

Le code est hashe avant stockage pour eviter de garder un code sensible en clair dans la base.

```js
expires_at = now() + interval '15 minutes'
```

Le code expire apres 15 minutes.

### Configuration necessaire Railway

Pour que l'email parte vraiment:

```text
RESEND_API_KEY=...
MAIL_FROM=TRUEFEED <adresse-verifiee@ton-domaine.com>
```

Sans `RESEND_API_KEY`, le backend logge le code en console pour le developpement, mais n'envoie pas de vrai email.

## 4. Connexion

### Probleme

La connexion pouvait subir le meme probleme CORS que l'inscription. Il y avait aussi un email pre-rempli dans l'interface.

### Correction

Fichier:
- `frontend/app/(auth)/login.tsx`

Actions:
- suppression de l'email pre-rempli;
- normalisation de l'email avant appel API;
- affichage du message backend quand disponible.

## 5. Client API frontend et correction CI

### Probleme CI

Le job frontend echouait sur:

```text
npm run typecheck
services/api/client.ts: Property 'message' does not exist on type 'never'
```

### Cause

Le payload JSON d'erreur etait caste avec `typeof payload`, ce qui gardait `null` dans le type et perturbait TypeScript.

### Correction

Fichier:
- `frontend/services/api/client.ts`

Avant:

```ts
payload = (await response.json()) as typeof payload;
```

Apres:

```ts
type ApiErrorPayload = {
  error?: string;
  message?: string;
  details?: unknown;
};

payload = (await response.json()) as ApiErrorPayload;
```

Resultat:
- `npm run lint` OK;
- `npm run typecheck` OK;
- `npm run build:web` OK.

## 6. Page Publish

### Objectif

Faire de Publish le point central de creation:
- Texte -> Debat;
- Bon plan -> Bon Plan;
- Image ou video -> Accueil.

### Correction

Fichier:
- `frontend/app/(tabs)/publish.tsx`

Les anciens boutons ont ete retires:
- `Photo`;
- `Vlog`;
- `Debat`;
- `Bon plan`.

Le nouveau flux utilise un etat simple:

```ts
type PublishMode = 'normal' | 'text' | 'media' | 'tip';
```

Lecture commentee:

```ts
if (nextMediaType === 'text') {
  setMode('text');
  setMediaType('text');
  setSelectedMediaUri(null);
  setCaption('');
  setStatus('');
  return;
}
```

Quand l'utilisateur clique sur `Texte`, on passe en mode plein ecran, sans ouvrir la galerie.

```ts
ImagePicker.launchImageLibraryAsync({
  mediaTypes:
    nextMediaType === 'video'
      ? ImagePicker.MediaTypeOptions.Videos
      : ImagePicker.MediaTypeOptions.Images,
});
```

Quand l'utilisateur clique sur `Image` ou `Video`, la galerie correspondante s'ouvre directement.

```ts
await goodTipsApi.create({
  place: place.trim(),
  budget: budget.trim(),
  transport: transport.trim(),
});
router.push('/bonplan');
```

Un bon plan est envoye a l'API Bon Plan puis redirige vers la page Bon Plan.

### Note importante media

Le flux image/video selectionne bien la galerie et route vers l'accueil. En revanche, l'upload reel du fichier vers S3/Railway n'est pas encore branche cote frontend. Le backend a une API media/presign, mais il faut encore connecter:
- demande d'URL pre-signee;
- upload du fichier;
- creation du post avec la vraie `mediaUrl`.

Pour eviter de bloquer toute la page, une URL placeholder est utilisee actuellement.

## 7. Page Bon Plan

### Probleme

La page Bon Plan contenait:
- des badges;
- des cadeaux;
- un formulaire local d'ajout;
- des statistiques visibles non demandees.

### Correction

Fichier:
- `frontend/app/(tabs)/bonplan.tsx`

Actions:
- suppression des sections badges/cadeaux;
- suppression du formulaire local;
- affichage des bons plans venant de l'API;
- les bons plans se creent depuis Publish.

## 8. Badges et cadeaux

### Probleme

Une partie etait statique dans l'interface, surtout dans Messages.

### Correction

Fichiers:
- `backend/src/services/goodTips.service.js`
- `backend/src/services/auth.service.js`
- `frontend/app/messages.tsx`

Backend:
- les badges sont attribues selon le nombre de bons plans;
- les cadeaux sont stockes dans `user_gifts`;
- `Resume Magique` est donne comme cadeau de bienvenue a l'inscription.

Frontend:
- la liste de cadeaux affiche `Resume Magique` debloque;
- les autres cadeaux sont bloques.

Message logique de badge:
- un badge est attribue quand l'utilisateur atteint un palier de bons plans;
- pas besoin d'IA pour cette partie: c'est une regle deterministe, donc plus fiable et moins couteuse.

## 9. Messages

### Probleme

Apres inscription, les conversations fictives restaient affichees.

### Correction

Fichier:
- `frontend/app/messages.tsx`

Quand un utilisateur est authentifie:
- les conversations de demo sont videes;
- les messages de demo sont vides;
- la bande `Voir mes cadeaux` a ete retiree.

## 10. Commentaires, likes et reponses

### Probleme

Les commentaires n'avaient pas:
- like;
- reponse a un autre commentaire;
- action visible correcte.

### Correction

Fichiers:
- `backend/src/services/posts.service.js`
- `backend/src/api/v1/routes/posts.routes.js`
- `frontend/app/post/[id].tsx`
- `frontend/services/api/posts.ts`

Backend:
- `addComment` accepte `parentId`;
- `toggleCommentLike` ajoute ou retire un like;
- verification que le commentaire parent existe et appartient au meme post.

Lecture commentee:

```js
if (parentId) {
  assertUuid(parentId, 'parentId');
  const parentResult = await query(
    `SELECT id FROM comments WHERE id = $1 AND post_id = $2 AND status = 'published'`,
    [parentId, postId],
  );
}
```

Ce bloc empeche de repondre a un commentaire inexistant ou appartenant a un autre post.

## 11. Republications et partages

### Probleme

Une personne pouvait cliquer plusieurs fois et augmenter le compteur sans limite.

### Correction

Fichiers:
- `backend/src/services/posts.service.js`
- `backend/src/api/v1/routes/posts.routes.js`
- `backend/migrations/001_truefeed_schema.sql`
- `frontend/app/(tabs)/debate.tsx`

Post shares:
- route protegee par authentification;
- index unique `(post_id, user_id)`;
- `ON CONFLICT DO NOTHING`.

Debat:
- le bouton republication est devenu un toggle local au lieu d'un increment infini.

## 12. Securite

Ce qui a ete ameliore:
- CORS plus strict en production;
- tokens d'acces et refresh token;
- refresh token hashe en base;
- mot de passe hashe avec PBKDF2;
- verification email par code expire;
- anti-spam simple sur posts/commentaires;
- routes sensibles protegees par `requireAuth`;
- partages multiples limites par utilisateur.

Ce qui reste a faire pour un vrai audit securite:
- activer et verifier toutes les variables Railway;
- brancher un vrai provider email avec domaine verifie;
- brancher l'upload media reel;
- ajouter des tests automatises backend;
- ajouter des tests e2e inscription/publication;
- verifier les secrets GitHub/Railway/Vercel;
- ajouter monitoring et alertes production.

## 13. Commandes de verification

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build:web
```

Backend:

```bash
cd backend
npm run lint
npm test
```

Note: `npm test` backend affiche actuellement:

```text
No automated tests configured yet
```

Cela veut dire que le script existe, mais qu'il n'y a pas encore de vrais tests backend.

## 14. Resume par fichier

| Fichier | Role |
| --- | --- |
| `backend/src/app.js` | Configuration Express, securite, CORS |
| `backend/src/config/env.js` | Variables d'environnement et domaines Vercel autorises |
| `backend/src/services/auth.service.js` | Inscription, connexion, tokens, code email |
| `backend/src/services/mail.service.js` | Envoi email via Resend ou log developpement |
| `backend/src/services/posts.service.js` | Posts, commentaires, likes, partages |
| `backend/src/services/goodTips.service.js` | Bons plans, badges, cadeaux |
| `backend/migrations/001_truefeed_schema.sql` | Tables, index, triggers, contraintes |
| `frontend/services/api/client.ts` | Client API, refresh token, erreurs API typees |
| `frontend/app/(auth)/signup.tsx` | Creation compte + verification code email |
| `frontend/app/(auth)/login.tsx` | Connexion |
| `frontend/app/(tabs)/publish.tsx` | Creation texte/media/bon plan |
| `frontend/app/(tabs)/bonplan.tsx` | Liste des bons plans |
| `frontend/app/messages.tsx` | Conversations, badges, cadeaux |
| `frontend/app/post/[id].tsx` | Detail post, commentaires, likes, reponses |
| `frontend/app/(tabs)/debate.tsx` | Debats, votes, republication toggle |

## 15. Conclusion

Les problemes visibles venaient surtout de trois familles:
- backend non configure pour les previews Vercel;
- frontend avec beaucoup de donnees statiques;
- workflows utilisateurs incomplets ou trop generiques.

Les corrections ont rendu le site plus coherent:
- l'inscription fonctionne mieux et guide l'utilisateur;
- la publication suit les bonnes destinations;
- les cadeaux/badges sont lies a une logique backend;
- les interactions sociales sont mieux controlees;
- la CI frontend repasse.

Le prochain gros chantier technique est l'upload media reel, car la selection galerie est faite mais l'envoi du fichier vers un stockage externe doit encore etre branche.
