import { API_BASE } from './api';

export function getBackendBaseUrl() {
  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    try {
      const url = new URL(API_BASE);
      if (url.pathname === '/api') {
        url.pathname = '/';
      } else if (url.pathname.endsWith('/api')) {
        url.pathname = url.pathname.slice(0, -4) || '/';
      }
      return url.origin + url.pathname.replace(/\/$/, '');
    } catch {
      return API_BASE.replace(/\/api\/?$/, '');
    }
  }

  if (API_BASE.startsWith('/api')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  return typeof window !== 'undefined' ? window.location.origin : '';
}

export function buildAppUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/#${normalized}`;
}

export function buildShareUrl(shareTokenOrQuoteNumber: string) {
  return `${getBackendBaseUrl()}/share/${encodeURIComponent(shareTokenOrQuoteNumber)}`;
}

export function buildPdfUrl(quoteId: string) {
  return buildAppUrl(`/quote-export/${encodeURIComponent(quoteId)}`);
}
