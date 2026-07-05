import { getScopedStorageKey, getStoredAuthUser } from './auth';
import { apiRequest } from './api';
import { Customer } from './types';

const CUSTOMER_STORAGE_KEY = getScopedStorageKey('ilovequote_saved_customers');

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function makeCustomerId() {
  return `customer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCustomerRecord(customer: Partial<Customer> = {}): Customer {
  const now = new Date().toISOString();
  const currentUserId = getStoredAuthUser()?.id ?? null;
  const ownerUserId = customer.ownerUserId ?? currentUserId;
  const createdAt = customer.createdAt || now;
  const updatedAt = customer.updatedAt || now;

  return {
    id: String(customer.id || makeCustomerId()),
    companyName: customer.companyName || '',
    contactPerson: customer.contactPerson || '',
    email: customer.email || '',
    phone: customer.phone || '',
    website: customer.website || '',
    taxIdType: customer.taxIdType || 'GSTIN',
    taxId: customer.taxId || '',
    poNumber: customer.poNumber || '',
    billingAddress: customer.billingAddress || '',
    city: customer.city || '',
    state: customer.state || '',
    zipCode: customer.zipCode || '',
    country: customer.country || '',
    notes: customer.notes || '',
    ownerUserId,
    createdAt,
    updatedAt,
  };
}

function loadLocalCustomers() {
  if (!canUseLocalStorage()) return [] as Customer[];

  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Customer[]) : [];
    return Array.isArray(parsed) ? parsed.map((customer) => normalizeCustomerRecord(customer)) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomers(customers: Customer[]) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
}

function shouldUseLocalFallback(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('not found') || message.includes('failed to fetch') || message.includes('request failed');
}

function mergeCustomerLists(remoteCustomers: Customer[], localCustomers: Customer[]) {
  const mergedById = new Map<string, Customer>();

  for (const customer of localCustomers) {
    mergedById.set(customer.id, customer);
  }

  for (const customer of remoteCustomers) {
    mergedById.set(customer.id, normalizeCustomerRecord(customer));
  }

  const remoteIds = new Set(remoteCustomers.map((customer) => customer.id));
  const localOnlyCustomers = localCustomers.filter((customer) => !remoteIds.has(customer.id));

  return [
    ...remoteCustomers.map((customer) => mergedById.get(customer.id) || customer),
    ...localOnlyCustomers,
  ];
}

function buildLocalCustomer(customer: Partial<Customer>) {
  const normalized = normalizeCustomerRecord(customer);
  const existingCustomers = loadLocalCustomers();
  const nextCustomers = [normalized, ...existingCustomers.filter((entry) => entry.id !== normalized.id)];
  saveLocalCustomers(nextCustomers);
  return normalized;
}

export async function fetchCustomers() {
  try {
    const payload = await apiRequest<{ items: Customer[] }>('/api/customers', { method: 'GET' });
    const remoteCustomers = Array.isArray(payload.items) ? payload.items.map((customer) => normalizeCustomerRecord(customer)) : [];
    const mergedCustomers = mergeCustomerLists(remoteCustomers, loadLocalCustomers());
    saveLocalCustomers(mergedCustomers);
    return mergedCustomers;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return loadLocalCustomers();
    }
    throw error;
  }
}

export async function createCustomer(customer: Partial<Customer>) {
  try {
    const payload = await apiRequest<{ customer: Customer }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });

    const savedCustomer = normalizeCustomerRecord(payload.customer);
    saveLocalCustomers([savedCustomer, ...loadLocalCustomers().filter((entry) => entry.id !== savedCustomer.id)]);
    return { customer: savedCustomer };
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;

    const nextCustomer = buildLocalCustomer(customer);
    return { customer: nextCustomer };
  }
}

export async function updateCustomer(id: string, patch: Partial<Customer>) {
  try {
    const payload = await apiRequest<{ customer: Customer }>(`/api/customers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });

    const updatedCustomer = normalizeCustomerRecord(payload.customer);
    saveLocalCustomers([updatedCustomer, ...loadLocalCustomers().filter((entry) => entry.id !== updatedCustomer.id)]);
    return { customer: updatedCustomer };
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;

    const existingCustomers = loadLocalCustomers();
    const existingCustomer = existingCustomers.find((entry) => entry.id === id);
    const updatedCustomer = normalizeCustomerRecord({
      ...existingCustomer,
      ...patch,
      id,
      ownerUserId: existingCustomer?.ownerUserId ?? getStoredAuthUser()?.id ?? null,
      createdAt: existingCustomer?.createdAt,
    });
    saveLocalCustomers([updatedCustomer, ...existingCustomers.filter((entry) => entry.id !== id)]);
    return { customer: updatedCustomer };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const payload = await apiRequest<{ ok: true }>(`/api/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    saveLocalCustomers(loadLocalCustomers().filter((entry) => entry.id !== id));
    return payload;
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;

    saveLocalCustomers(loadLocalCustomers().filter((entry) => entry.id !== id));
    return { ok: true as const };
  }
}
