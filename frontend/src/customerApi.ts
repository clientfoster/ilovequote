import { apiRequest } from './api';
import { Customer } from './types';

export async function fetchCustomers() {
  const payload = await apiRequest<{ items: Customer[] }>('/api/customers', { method: 'GET' });
  return payload.items || [];
}

export async function createCustomer(customer: Partial<Customer>) {
  return apiRequest<{ customer: Customer }>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(id: string, patch: Partial<Customer>) {
  return apiRequest<{ customer: Customer }>(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteCustomer(id: string) {
  return apiRequest<{ ok: true }>(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
