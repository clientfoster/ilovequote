import { getScopedStorageKey, getStoredAuthUser } from './auth';
import { apiRequest } from './api';
import { InvoiceRecord } from './types';

const INVOICE_STORAGE_KEY = getScopedStorageKey('ilovequote_saved_invoices');

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function loadLocalInvoices() {
  if (!canUseLocalStorage()) return [] as InvoiceRecord[];

  try {
    const raw = localStorage.getItem(INVOICE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as InvoiceRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalInvoices(invoices: InvoiceRecord[]) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
}

function shouldUseLocalFallback(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('not found') || message.includes('failed to fetch') || message.includes('request failed');
}

function buildLocalInvoice(invoice: Partial<InvoiceRecord>) {
  const now = new Date().toISOString();
  const user = getStoredAuthUser();
  return {
    ...(invoice as InvoiceRecord),
    id: invoice.id || `invoice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: invoice.status || 'Draft',
    ownerUserId: invoice.ownerUserId || user?.id || null,
    createdAt: invoice.createdAt || now,
    updatedAt: now,
  } satisfies InvoiceRecord;
}

export async function fetchUserInvoices() {
  try {
    const payload = await apiRequest<{ items: InvoiceRecord[] }>('/api/invoices', { method: 'GET' });
    return payload.items || [];
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return loadLocalInvoices();
    }
    throw error;
  }
}

export async function createInvoice(invoice: Partial<InvoiceRecord>) {
  try {
    return await apiRequest<{ invoice: InvoiceRecord }>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;

    const nextInvoice = buildLocalInvoice(invoice);
    const invoices = loadLocalInvoices();
    saveLocalInvoices([nextInvoice, ...invoices.filter((item) => item.id !== nextInvoice.id)]);
    return { invoice: nextInvoice };
  }
}

export async function updateInvoice(id: string, patch: Partial<InvoiceRecord>) {
  try {
    return await apiRequest<{ invoice: InvoiceRecord }>(`/api/invoices/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;

    const invoices = loadLocalInvoices();
    const existing = invoices.find((item) => item.id === id);
    const updatedInvoice = buildLocalInvoice({ ...existing, ...patch, id });
    saveLocalInvoices([updatedInvoice, ...invoices.filter((item) => item.id !== id)]);
    return { invoice: updatedInvoice };
  }
}

export async function deleteInvoice(id: string) {
  try {
    return await apiRequest<{ ok: true }>(`/api/invoices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;

    saveLocalInvoices(loadLocalInvoices().filter((item) => item.id !== id));
    return { ok: true as const };
  }
}
