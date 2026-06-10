import { apiClient } from './client';
import type { AuthUser } from './auth';

export const usersApi = {
  updateMe(payload: { displayName?: string; avatarUrl?: string; bio?: string; language?: 'fr' | 'en' }) {
    return apiClient.patch<{ user: AuthUser }, typeof payload>('/api/v1/users/me', payload);
  },
};
