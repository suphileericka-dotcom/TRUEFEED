# TRUEFEED Media Storage Strategy

## Objectif

Stocker les medias de posts sans faire transiter les fichiers lourds par l'API.

## Strategie cible

- Storage: AWS S3 ou service compatible S3.
- Upload: URL presignee generee par le backend.
- Flux:
  1. Le frontend demande une URL d'upload.
  2. Le backend valide le type, la taille et l'utilisateur.
  3. Le backend renvoie une URL presignee courte.
  4. Le frontend upload directement vers S3.
  5. Le frontend confirme le media a l'API avec la cle S3.

## Endpoints v1

```txt
POST /api/v1/media/presign
POST /api/v1/media/complete
```

## Formats acceptes

- Images: `image/jpeg`, `image/png`, `image/webp`.
- Videos: `video/mp4`, `video/quicktime`.

## Limites initiales

- Image: 10 MB.
- Video: 250 MB.
- Duree video recommandee: 90 secondes maximum pour le MVP.

## Compression frontend

- Image: convertir en JPEG/WebP si possible, largeur max 1600 px.
- Video: compresser avant upload quand le device le permet.
- Garder le fichier original uniquement si la qualite compressee est insuffisante.

## Nommage S3

```txt
users/{userId}/posts/{postId}/{mediaId}.{ext}
```

## Securite

- URL presignee expire en 5 minutes.
- Le backend ne signe que les types MIME autorises.
- La cle S3 est generee par le backend, jamais par le client.
- Les fichiers publies sont servis via CDN plus tard.
