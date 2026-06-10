import { apiClient } from './client';

export type UserRole = 'user' | 'moderator' | 'admin';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  language?: 'fr' | 'en';
  role: UserRole;
  status: string;
  emailVerifiedAt?: string | null;
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
  emailVerificationRequired?: boolean;
};

export const authApi = {
  login(payload: { email: string; password: string }) {
    return apiClient.post<AuthResponse, typeof payload>('/api/v1/auth/login', payload);
  },

  register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    return apiClient.post<AuthResponse, typeof payload>('/api/v1/auth/register', payload);
  },

  completeUsername(payload: { username?: string; firstName: string }) {
    return apiClient.post<{ user: AuthUser }, typeof payload>('/api/v1/auth/username', payload);
  },

  verifyEmail(payload: { token: string }) {
    return apiClient.post<{ verified: boolean; user?: AuthUser }, typeof payload>(
      '/api/v1/auth/verify-email',
      payload,
    );
  },

  forgotPassword(payload: { email: string }) {
    return apiClient.post<{ sent: boolean }, typeof payload>('/api/v1/auth/forgot-password', payload);
  },

  resetPassword(payload: { token: string; password: string }) {
    return apiClient.post<{ reset: boolean }, typeof payload>('/api/v1/auth/reset-password', payload);
  },

  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return apiClient.post<{ changed: boolean }, typeof payload>(
      '/api/v1/auth/change-password',
      payload,
    );
  },

  logout(refreshToken: string) {
    return apiClient.post('/api/v1/auth/logout', { refreshToken });
  },
};
