import { apiClient } from './client';

export type GoodTip = {
  id: string;
  userId: string;
  author: string;
  place: string;
  budget: string;
  transport: string;
  rating: number;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
};

export const goodTipsApi = {
  list() {
    return apiClient.get<{ items: GoodTip[] }>('/api/v1/good-tips');
  },

  create(payload: { place: string; budget: string; transport: string }) {
    return apiClient.post<{ tip: GoodTip; sharedCount: number }, typeof payload>(
      '/api/v1/good-tips',
      payload,
    );
  },

  rewards() {
    return apiClient.get<{
      badges: { number: number; unlockedAt: string }[];
      gifts: { number: number; stock: number; unlockedAt: string }[];
    }>('/api/v1/good-tips/me/rewards');
  },
};
