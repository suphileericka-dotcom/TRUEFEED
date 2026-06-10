const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');

const {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { createHttpError } = require('../utils/httpError');

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const maxSizeBytes = 100 * 1024 * 1024;
const maxImageSizeBytes = 10 * 1024 * 1024;
const maxVideoSizeBytes = 50 * 1024 * 1024;
const maxVideoDurationSeconds = 60;
const multipartThresholdBytes = 20 * 1024 * 1024;
const multipartPartSizeBytes = 10 * 1024 * 1024;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw createHttpError(500, 'media_storage_not_configured', `${name} manquant.`);
  }

  return value;
}

function getS3Client() {
  const config = {
    region: getRequiredEnv('AWS_REGION'),
  };

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT;
    config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
  }

  return new S3Client(config);
}

function getExtension(contentType) {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'video/quicktime') return 'mov';
  return contentType.split('/')[1];
}

function validateMediaPayload(payload = {}) {
  const contentType = String(payload.contentType || '');
  const sizeBytes = Number(payload.sizeBytes) || 0;

  if (!allowedTypes.includes(contentType)) {
    throw createHttpError(400, 'invalid_media_type', 'Type media non supporte.');
  }

  if (sizeBytes <= 0) {
    throw createHttpError(400, 'invalid_media_size', 'Taille media invalide.');
  }

  if (sizeBytes > maxSizeBytes) {
    throw createHttpError(400, 'media_too_large', 'Media trop volumineux.', { maxSizeBytes });
  }

  return { contentType, sizeBytes };
}

function configureCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw createHttpError(
      500,
      'cloudinary_not_configured',
      'Cloudinary n est pas configure sur le serveur.',
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function validateUploadFile(file, payload = {}) {
  if (!file) {
    throw createHttpError(400, 'media_file_required', 'Fichier media requis.');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw createHttpError(400, 'invalid_media_type', 'Type media non supporte.');
  }

  const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
  const maxSize = mediaType === 'video' ? maxVideoSizeBytes : maxImageSizeBytes;
  const durationSeconds = Number(payload.durationSeconds || payload.duration || 0);

  if (file.size > maxSize) {
    throw createHttpError(
      400,
      'media_too_large',
      mediaType === 'video' ? 'La video doit faire 50 Mo maximum.' : 'La photo doit faire 10 Mo maximum.',
      { maxSizeBytes: maxSize },
    );
  }

  if (mediaType === 'video' && durationSeconds > maxVideoDurationSeconds) {
    throw createHttpError(400, 'video_too_long', 'La video doit durer 60 secondes maximum.', {
      maxDurationSeconds: maxVideoDurationSeconds,
    });
  }

  return { mediaType, durationSeconds };
}

function uploadBufferToCloudinary(file, { mediaType, user }) {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `truefeed/${user.id}/posts`,
        resource_type: mediaType === 'video' ? 'video' : 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    upload.end(file.buffer);
  });
}

async function uploadMedia(file, payload = {}, user) {
  const validation = validateUploadFile(file, payload);
  const result = await uploadBufferToCloudinary(file, { ...validation, user });

  return {
    id: result.public_id,
    url: result.secure_url,
    mediaType: validation.mediaType,
    sizeBytes: file.size,
    durationSeconds: result.duration || validation.durationSeconds || null,
    width: result.width || null,
    height: result.height || null,
    provider: 'cloudinary',
  };
}

async function createSingleUpload({ bucket, key, contentType, sizeBytes }) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: sizeBytes,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: 900 });
}

async function createMultipartUpload({ bucket, key, contentType, sizeBytes }) {
  const client = getS3Client();
  const createResult = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
  );
  const uploadId = createResult.UploadId;
  const partCount = Math.ceil(sizeBytes / multipartPartSizeBytes);
  const parts = await Promise.all(
    Array.from({ length: partCount }, async (_item, index) => {
      const partNumber = index + 1;
      const uploadUrl = await getSignedUrl(
        client,
        new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        }),
        { expiresIn: 900 },
      );

      return { partNumber, uploadUrl };
    }),
  );

  return { uploadId, parts };
}

async function createPresignedUpload(payload = {}, user = null) {
  const { contentType, sizeBytes } = validateMediaPayload(payload);
  const bucket = getRequiredEnv('S3_BUCKET');
  const mediaId = crypto.randomUUID();
  const extension = getExtension(contentType);
  const ownerPrefix = user?.id ? `users/${user.id}` : 'anonymous';
  const key = `${ownerPrefix}/uploads/${mediaId}.${extension}`;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  const isMultipart = sizeBytes > multipartThresholdBytes;
  const multipart = isMultipart
    ? await createMultipartUpload({ bucket, key, contentType, sizeBytes })
    : null;

  return {
    mediaId,
    key,
    uploadMode: isMultipart ? 'multipart' : 'single',
    uploadUrl: isMultipart
      ? null
      : await createSingleUpload({ bucket, key, contentType, sizeBytes }),
    uploadId: multipart?.uploadId,
    parts: multipart?.parts,
    partSizeBytes: isMultipart ? multipartPartSizeBytes : undefined,
    publicUrl: publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/${key}` : null,
    expiresIn: 900,
    processing: {
      compression: contentType.startsWith('image/') ? 'client-webp-or-jpeg-1600px' : 'client-h264-720p',
      thumbnails: contentType.startsWith('video/'),
    },
  };
}

async function completeMultipartUpload(payload = {}) {
  const bucket = getRequiredEnv('S3_BUCKET');
  const key = String(payload.key || '');
  const uploadId = String(payload.uploadId || '');
  const parts = Array.isArray(payload.parts) ? payload.parts : [];

  if (!key || !uploadId || parts.length === 0) {
    throw createHttpError(400, 'invalid_multipart_complete', 'Payload multipart invalide.');
  }

  await getS3Client().send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((part) => ({
          ETag: part.etag || part.ETag,
          PartNumber: Number(part.partNumber || part.PartNumber),
        })),
      },
    }),
  );

  return { ok: true, key };
}

module.exports = {
  mediaService: {
    completeMultipartUpload,
    createPresignedUpload,
    uploadMedia,
  },
};
