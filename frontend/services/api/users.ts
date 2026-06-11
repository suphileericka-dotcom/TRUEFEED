// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { apiClient } from './client';
import type { AuthUser } from './auth';

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
  relation: 'none' | 'self' | 'friends' | 'pending_sent' | 'pending_received';
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
};

export type FriendRequestNotification = {
  id: string;
  type: 'friend_request';
  createdAt: string;
  from: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
};

function toQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : '';
}

export const usersApi = {
  updateMe(payload: { displayName?: string; avatarUrl?: string; bio?: string; language?: 'fr' | 'en' }) {
    return apiClient.patch<{ user: AuthUser }, typeof payload>('/api/v1/users/me', payload);
  },

  listPublic(params: { q?: string; limit?: number; viewerId?: string } = {}) {
    return apiClient.get<{ items: PublicUser[] }>(`/api/v1/users/public${toQuery(params)}`);
  },

  getPublic(id: string, viewerId?: string) {
    return apiClient.get<{ user: PublicUser }>(
      `/api/v1/users/public/${encodeURIComponent(id)}${toQuery({ viewerId })}`,
    );
  },

  sendFriendRequest(userId: string) {
    return apiClient.post<{ request: { id: string; status: string } }, Record<string, never>>(
      `/api/v1/users/${encodeURIComponent(userId)}/friend-requests`,
      {},
    );
  },

  listNotifications() {
    return apiClient.get<{ items: FriendRequestNotification[] }>('/api/v1/users/me/notifications');
  },

  resolveFriendRequest(requestId: string, accepted: boolean) {
    return apiClient.post<{ request: { id: string; status: string } }, { accepted: boolean }>(
      `/api/v1/users/me/friend-requests/${encodeURIComponent(requestId)}/resolve`,
      { accepted },
    );
  },
};
