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

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  author: string;
  parentId?: string | null;
  content: string;
  likesCount: number;
  createdAt: string;
};

export const postsApi = {
  create(payload: CreatePostPayload, authToken: string) {
    return apiClient.post('/api/v1/posts', payload, { authToken });
  },

  share(postId: string) {
    return apiClient.post<{ shared: boolean; shareId: string | null; sharesCount: number }, Record<string, never>>(
      `/api/v1/posts/${postId}/share`,
      {},
    );
  },

  comment(postId: string, payload: { content: string; parentId?: string }) {
    return apiClient.post<{ comment: PostComment }, typeof payload>(
      `/api/v1/posts/${postId}/comments`,
      payload,
    );
  },

  likeComment(commentId: string) {
    return apiClient.post<{ liked: boolean; likesCount: number }, Record<string, never>>(
      `/api/v1/posts/comments/${commentId}/like`,
      {},
    );
  },
};
