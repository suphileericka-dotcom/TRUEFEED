import { apiClient } from './client';

export type CreatePostPayload = {
  title?: string;
  caption: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  format: 'vlog' | 'photo' | 'tip' | 'debate';
  location?: string;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  tags?: string[];
};

export const postsApi = {
  create(payload: CreatePostPayload, authToken: string) {
    return apiClient.post('/api/v1/posts', payload, { authToken });
  },

  share(postId: string) {
    return apiClient.post(`/api/v1/posts/${postId}/share`, {});
  },
};
