const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

const mediaResolver = {
  createPresignedUpload({ fileName, mimeType, size }) {
    if (!allowedMimeTypes.includes(mimeType)) {
      return {
        ok: false,
        error: 'unsupported_media_type',
      };
    }

    return {
      ok: true,
      uploadUrl: null,
      expiresInSeconds: 300,
      fields: {
        fileName,
        mimeType,
        size,
      },
      message: 'S3 presigned upload sera branche apres configuration storage.',
    };
  },
};

module.exports = {
  mediaResolver,
};
