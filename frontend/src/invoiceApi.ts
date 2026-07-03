import { apiRequest } from './api';
import { InvoiceRecord } from './types';

export async function fetchUserInvoices() {
  const payload = await apiRequest<{ items: InvoiceRecord[] }>('/api/invoices', { method: 'GET' });
  return payload.items || [];
}

export async function createInvoice(invoice: Partial<InvoiceRecord>) {
  return apiRequest<{ invoice: InvoiceRecord }>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoice),
  });
}

export async function updateInvoice(id: string, patch: Partial<InvoiceRecord>) {
  return apiRequest<{ invoice: InvoiceRecord }>(`/api/invoices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteInvoice(id: string) {
  return apiRequest<{ ok: true }>(`/api/invoices/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
