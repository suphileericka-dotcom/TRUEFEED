import { env } from '@/constants/env';
import { trackError } from '@/services/monitoring';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '@/services/session-storage';
import type { AuthResponse } from './auth';

type RequestOptions = RequestInit & {
  authToken?: string;
  skipAuthRefresh?: boolean;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const headers = new Headers(options.headers);
  const storedSession = await readStoredSession();

  headers.set('Content-Type', 'application/json');

  const token = options.authToken || storedSession.session?.accessToken;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !options.skipAuthRefresh && storedSession.session?.refreshToken) {
    const refreshed = await refreshSession(storedSession.session.refreshToken);

    if (refreshed) {
      return request<TResponse>(path, {
        ...options,
        authToken: refreshed.session.accessToken,
        skipAuthRefresh: true,
      });
    }

    await clearStoredSession(true);
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;

    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }

    const error = new ApiError(
      payload?.message || `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      payload?.error,
      payload?.details,
    );
    trackError(error, { path, status: response.status });
    throw error;
  }

  return response.json() as Promise<TResponse>;
}

async function refreshSession(refreshToken: string): Promise<AuthResponse | null> {
  const response = await fetch(`${env.apiUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const authResponse = (await response.json()) as AuthResponse;

  await writeStoredSession({
    isAuthenticated: true,
    hasKnownAccount: true,
    user: authResponse.user,
    session: authResponse.session,
  });

  return authResponse;
}

export const apiClient = {
  get<TResponse>(path: string, options?: RequestOptions) {
    return request<TResponse>(path, {
      ...options,
      method: 'GET',
    });
  },

  post<TResponse, TPayload>(path: string, payload: TPayload, options?: RequestOptions) {
    return request<TResponse>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
