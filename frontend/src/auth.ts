export const AUTH_STORAGE_KEY = 'ilovequote_auth_state';
export const AUTH_TOKEN_KEY = 'ilovequote_auth_token';

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEY)) && Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

export function signIn(token: string, email?: string) {
  localStorage.setItem(AUTH_STORAGE_KEY, email || 'signed_in');
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}
