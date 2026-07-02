export const AUTH_STORAGE_KEY = 'ilovequote_auth_state';
export const AUTH_TOKEN_KEY = 'ilovequote_auth_token';
export const AUTH_USER_KEY = 'ilovequote_auth_user';
export const AUTH_STATE_EVENT = 'auth-state-changed';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  username?: string;
  authMethod?: 'email' | 'phone' | 'google' | 'facebook' | 'apple';
  createdAt?: string;
  updatedAt?: string;
  loginActivity?: Array<{
    id: string;
    type: string;
    at: string;
    ip?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }>;
}

function normalizeScope(value: string) {
  return String(value || 'guest')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'guest';
}

function notifyAuthStateChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
}

export function isInternalPhoneEmail(value?: string) {
  return /@phone\.ilovequote\.local$/i.test(String(value || '').trim());
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEY)) && Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

export function signIn(token: string, user?: AuthUser | string) {
  const scope = typeof user === 'string'
    ? user
    : isInternalPhoneEmail(user?.email)
      ? user?.phone || user?.username || user?.id
      : user?.email || user?.phone || user?.username || user?.id;
  const payload = typeof user === 'string'
    ? { email: user, name: user, username: user, authMethod: 'email' as const }
    : user || null;

  localStorage.setItem(AUTH_STORAGE_KEY, normalizeScope(scope || 'signed_in'));
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (payload) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload));
  }
  notifyAuthStateChanged();
}

export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  notifyAuthStateChanged();
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
  const scope = isInternalPhoneEmail(user.email) ? user.phone || user.username || user.id : user.email || user.phone || user.username || user.id;
  localStorage.setItem(AUTH_STORAGE_KEY, normalizeScope(scope || user.name || 'signed_in'));
  notifyAuthStateChanged();
}

export function getDisplayAuthUser() {
  const user = getStoredAuthUser();
  const publicEmail = isInternalPhoneEmail(user?.email) ? '' : user?.email?.trim() || '';
  const displayName = user?.name?.trim() || user?.username?.trim() || publicEmail || user?.phone?.trim() || 'Account';
  const username = user?.username?.trim() || user?.phone?.trim() || publicEmail || '';
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
    username,
    initials,
    email: publicEmail,
    phone: user?.phone || '',
  };
}

export function getScopedStorageKey(baseKey: string) {
  return `${baseKey}:${getAuthScope()}`;
}
