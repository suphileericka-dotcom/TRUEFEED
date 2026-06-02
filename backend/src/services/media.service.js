const crypto = require('crypto');

const { createHttpError } = require('../utils/httpError');

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const maxSizeBytes = 100 * 1024 * 1024;

function createPresignedUpload(payload = {}) {
  const contentType = String(payload.contentType || '');
  const sizeBytes = Number(payload.sizeBytes) || 0;

  if (!allowedTypes.includes(contentType)) {
    throw createHttpError(400, 'invalid_media_type', 'Type media non supporte.');
  }

  if (sizeBytes > maxSizeBytes) {
    throw createHttpError(400, 'media_too_large', 'Media trop volumineux.', { maxSizeBytes });
  }

  const mediaId = `media_${crypto.randomUUID()}`;
  const extension = contentType.includes('video') ? 'mp4' : contentType.split('/')[1];
  const key = `uploads/${mediaId}.${extension}`;

  return {
    mediaId,
    key,
    uploadMode: sizeBytes > 20 * 1024 * 1024 ? 'multipart' : 'single',
    uploadUrl: `https://s3.local.truefeed/${key}?signature=dev-${mediaId}`,
    publicUrl: `https://cdn.local.truefeed/${key}`,
    expiresIn: 900,
    processing: {
      compression: contentType.startsWith('image/') ? 'webp-preview-1600px' : 'h264-720p-preview',
      thumbnails: true,
    },
  };
}

module.exports = {
  mediaService: {
    createPresignedUpload,
  },
};
