import { apiClient } from './client';

export type UserRole = 'user' | 'moderator' | 'admin';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: UserRole;
  status: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type AuthResponse = {
  user: AuthUser;
  session: AuthSession;
};

export const authApi = {
  login(payload: { email: string; password: string }) {
    return apiClient.post<AuthResponse, typeof payload>('/api/v1/auth/login', payload);
  },

  register(payload: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) {
    return apiClient.post<AuthResponse, typeof payload>('/api/v1/auth/register', payload);
  },

  logout(refreshToken: string) {
    return apiClient.post('/api/v1/auth/logout', { refreshToken });
  },
};
