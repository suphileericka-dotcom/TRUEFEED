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

export type FeedPost = {
  id: string;
  author: string;
  title?: string | null;
  caption: string;
  mediaUrl?: string | null;
  mediaType: 'image' | 'video' | 'text';
  format: 'vlog' | 'photo' | 'tip' | 'debate';
  location?: string | null;
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  tags: string[];
  publishedAt: string;
};

export type FeedResponse = {
  items: FeedPost[];
  nextCursor: string | null;
  sort: 'algorithm' | 'trending' | 'recent';
};

export const postsApi = {
  listFeed(params: { cursor?: string | null; limit?: number; sort?: 'algorithm' | 'trending' | 'recent' } = {}) {
    const searchParams = new URLSearchParams();

    if (params.cursor) {
      searchParams.set('cursor', params.cursor);
    }

    if (params.limit) {
      searchParams.set('limit', String(params.limit));
    }

    if (params.sort) {
      searchParams.set('sort', params.sort);
    }

    const queryString = searchParams.toString();

    return apiClient.get<FeedResponse>(`/api/v1/posts/feed${queryString ? `?${queryString}` : ''}`);
  },

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
