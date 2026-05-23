const ADMIN_TOKEN_KEY = 'barber_admin_token';
import { reportClientLog, serializeUnknownError } from './errorMonitoring';

export class ApiError extends Error {
  status: number;
  payload: unknown;
  requestId?: string;

  constructor(message: string, status: number, payload: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.requestId = requestId;
  }
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function api<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (options.auth) {
    const token = getAdminToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch (error) {
    void reportClientLog({
      level: 'error',
      source: 'client.api.network',
      message: 'API request failed before receiving a response',
      context: {
        path,
        method: options.method || 'GET',
        error: serializeUnknownError(error),
      },
    });
    throw error;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();
  const payloadRequestId =
    typeof payload === 'object' && payload && 'requestId' in payload ? String((payload as any).requestId || '') : '';
  const requestId = payloadRequestId || response.headers.get('x-request-id') || undefined;

  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.error ? payload.error : 'Request failed';
    if (response.status >= 500) {
      void reportClientLog({
        level: 'error',
        source: 'client.api.server',
        message: String(message),
        context: {
          path,
          method: options.method || 'GET',
          status: response.status,
          requestId,
          payload: typeof payload === 'string' ? payload : serializeUnknownError(payload),
        },
      });
    }
    throw new ApiError(String(message), response.status, payload, requestId);
  }

  return payload as T;
}
