import { getAuthToken } from './auth';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? 'http://localhost:3001' : '');

export function apiUrl(path: string) {
  const base = API_BASE.replace(/\/$/, '');
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (base.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4);
  }

  return `${base}${normalizedPath}`;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Request failed');
  }
  return payload;
}
