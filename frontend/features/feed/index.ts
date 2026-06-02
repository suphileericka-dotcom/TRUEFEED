import { apiClient } from '@/services/api';

export type FeedPost = {
  id: string;
  author: string;
  location: string;
  caption: string;
  format: string;
  season?: string;
  likes: number;
};

export function getFeed() {
  return apiClient.get<FeedPost[]>('/api/v1/feed');
}
