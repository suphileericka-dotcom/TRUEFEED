// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Platform } from 'react-native';

import { env } from '@/constants/env';
import { readStoredSession } from '@/services/session-storage';

export type UploadedMedia = {
  id: string;
  url: string;
  mediaType: 'image' | 'video';
  sizeBytes: number;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  provider: 'cloudinary';
};

type UploadAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  duration?: number | null;
};

async function createFormData(asset: UploadAsset, mediaType: 'image' | 'video') {
  const formData = new FormData();
  const mimeType = asset.mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
  const fileName = asset.fileName || `truefeed-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;

  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    const blob = await response.blob();

    formData.append('file', blob, fileName);
  } else {
    formData.append('file', {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }

  if (asset.duration) {
    formData.append('durationSeconds', String(asset.duration / 1000));
  }

  return formData;
}

export const mediaApi = {
  async upload(
    asset: UploadAsset,
    mediaType: 'image' | 'video',
    onProgress?: (progress: number) => void,
  ) {
    const storedSession = await readStoredSession();
    const formData = await createFormData(asset, mediaType);

    return new Promise<{ media: UploadedMedia }>((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.open('POST', `${env.apiUrl}/api/v1/media/upload`);

      if (storedSession.session?.accessToken) {
        request.setRequestHeader('Authorization', `Bearer ${storedSession.session.accessToken}`);
      }

      request.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.min(event.loaded / event.total, 0.98));
        }
      };
      request.onload = () => {
        try {
          const payload = JSON.parse(request.responseText || '{}');

          if (request.status >= 200 && request.status < 300) {
            onProgress?.(1);
            resolve(payload);
            return;
          }

          reject(new Error(payload.message || `Upload failed: ${request.status}`));
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () => reject(new Error('Upload impossible. Verifie ta connexion.'));
      request.send(formData);
    });
  },
};
