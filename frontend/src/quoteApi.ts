import { apiRequest } from './api';
import { Quote } from './types';

export type StoredQuote = Quote & {
  ownerUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchUserQuotes() {
  const payload = await apiRequest<{ items: StoredQuote[] }>('/api/quotes', { method: 'GET' });
  return payload.items || [];
}

export async function createQuote(quote: Partial<StoredQuote>) {
  return apiRequest<{ quote: StoredQuote }>('/api/quotes', {
    method: 'POST',
    body: JSON.stringify(quote),
  });
}

export async function updateQuote(id: string, patch: Partial<StoredQuote>) {
  return apiRequest<{ quote: StoredQuote }>(`/api/quotes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteQuote(id: string) {
  return apiRequest<{ ok: true }>(`/api/quotes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
