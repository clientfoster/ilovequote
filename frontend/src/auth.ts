export const AUTH_STORAGE_KEY = 'ilovequote_auth_state';
export const AUTH_TOKEN_KEY = 'ilovequote_auth_token';
export const AUTH_USER_KEY = 'ilovequote_auth_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

function normalizeScope(value: string) {
  return String(value || 'guest')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'guest';
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEY)) && Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

export function signIn(token: string, user?: AuthUser | string) {
  const email = typeof user === 'string' ? user : user?.email;
  const payload = typeof user === 'string'
    ? { email: user, name: user }
    : user || null;

  localStorage.setItem(AUTH_STORAGE_KEY, normalizeScope(email || 'signed_in'));
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (payload) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload));
  }
}

export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function getAuthScope() {
  if (typeof window === 'undefined') return 'guest';
  return normalizeScope(localStorage.getItem(AUTH_STORAGE_KEY) || 'guest');
}

export function getStoredAuthUser() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_STORAGE_KEY, normalizeScope(user.email || user.name || 'signed_in'));
}

export function getDisplayAuthUser() {
  const user = getStoredAuthUser();
  const displayName = user?.name?.trim() || user?.email?.trim() || 'Account';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'A';

  return {
    user,
    displayName,
    initials,
    email: user?.email || '',
  };
}

export function getScopedStorageKey(baseKey: string) {
  return `${baseKey}:${getAuthScope()}`;
}
