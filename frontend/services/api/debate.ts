import { apiClient } from './client';

export type DebateVote = 'up' | 'down';

export const debateApi = {
  listThreads() {
    return apiClient.get('/api/v1/debate/threads');
  },

  vote(threadId: string, value: DebateVote, authToken: string) {
    return apiClient.post(`/api/v1/debate/threads/${threadId}/votes`, { value }, { authToken });
  },

  reply(threadId: string, body: string, authToken: string) {
    return apiClient.post(`/api/v1/debate/threads/${threadId}/replies`, { body }, { authToken });
  },
};
