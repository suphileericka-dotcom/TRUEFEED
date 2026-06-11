// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { apiClient } from './client';

export const translationApi = {
  translate(payload: { text: string; targetLanguage: 'fr' | 'en' }) {
    return apiClient.post<{ text: string; provider: string; cached: boolean }, typeof payload>(
      '/api/v1/translation',
      payload,
    );
  },
};
