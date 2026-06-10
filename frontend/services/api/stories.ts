import { apiClient } from './client';

export type Story = {
  id: string;
  authorId: string;
  author: string;
  authorName: string;
  text: string | null;
  mediaType: 'image' | 'video' | null;
  mediaUrl: string | null;
  durationMs?: number | null;
  backgroundColor: string;
  viewsCount: number;
  createdAt: string;
  expiresAt: string;
};

export type StoryViewer = {
  id: string;
  username: string;
  displayName: string;
  viewedAt: string;
  online: boolean;
  lastSeenAt?: string | null;
};

export const storiesApi = {
  list() {
    return apiClient.get<{ items: Story[] }>('/api/v1/stories');
  },

  create(payload: {
    text?: string;
    mediaType?: 'image' | 'video';
    mediaUrl?: string;
    durationMs?: number;
    backgroundColor: string;
  }) {
    return apiClient.post<{ story: Story }, typeof payload>('/api/v1/stories', payload);
  },

  detail(storyId: string) {
    return apiClient.get<{ story: Story; viewers: StoryViewer[] }>(`/api/v1/stories/${storyId}`);
  },

  markViewed(storyId: string) {
    return apiClient.post<{ viewed: boolean; viewsCount: number }, Record<string, never>>(
      `/api/v1/stories/${storyId}/view`,
      {},
    );
  },
};
