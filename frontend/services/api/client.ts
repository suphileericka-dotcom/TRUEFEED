import { env } from '@/constants/env';
import { trackError } from '@/services/monitoring';

type RequestOptions = RequestInit & {
  authToken?: string;
};

async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (options.authToken) {
    headers.set('Authorization', `Bearer ${options.authToken}`);
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
    trackError(error, { path, status: response.status });
    throw error;
  }

  return response.json() as Promise<TResponse>;
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
