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
    return Array.isArray(parsed) ? parsed.map((invoice) => normalizeLocalInvoice(invoice)) : [];
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

function getLocalIsoDate(date = new Date()) {
  const localTime = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localTime).toISOString().slice(0, 10);
}

function addDaysToIsoDate(isoDate: string, days: number) {
  const next = new Date(`${isoDate}T00:00:00`);
  next.setDate(next.getDate() + days);
  return getLocalIsoDate(next);
}

function normalizeLocalLineItem(item: Partial<InvoiceRecord['lineItems'][number]> & { unitPrice?: number; gstRate?: number } = {}) {
  const quantity = Math.max(0, Number(item.quantity ?? 0) || 0);
  const rate = Math.max(0, Number(item.rate ?? item.unitPrice ?? 0) || 0);
  const tax = Math.max(0, Number(item.tax ?? item.gstRate ?? 0) || 0);
  const amount = Number((quantity * rate + (quantity * rate * tax) / 100).toFixed(2));

  return {
    id: String(item.id || `invoice_item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name: String(item.name || '').trim(),
    description: String(item.description || '').trim(),
    quantity,
    rate,
    tax,
    amount,
  };
}

function normalizeLocalInvoice(invoice: Partial<InvoiceRecord>) {
  const rawLineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  const lineItems = rawLineItems.map((item) => normalizeLocalLineItem(item as Partial<InvoiceRecord['lineItems'][number]>));
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const grossTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const discountValue = Math.max(0, Number((invoice as Record<string, unknown>).discountValue ?? 0) || 0);
  const discountType = (invoice as Record<string, unknown>).discountType === 'Flat' ? 'Flat' : '%';
  const discountAmount = discountType === '%' ? subtotal * (discountValue / 100) : discountValue;
  const totalAmount = Number((grossTotal - discountAmount).toFixed(2));
  const invoiceNumber = String(invoice.invoiceNumber || '').trim();
  const invoiceDate = String(invoice.invoiceDate || '').trim();
  const isLegacySeed = invoiceNumber === 'INV00234' && (invoiceDate === '' || invoiceDate === '2024-01-17');
  const resolvedInvoiceDate = isLegacySeed ? getLocalIsoDate() : (invoiceDate || getLocalIsoDate());
  const resolvedDueDate = invoice.showDueDate
    ? String(invoice.dueDate || '').trim() || addDaysToIsoDate(resolvedInvoiceDate, 14)
    : '';

  return {
    ...(invoice as InvoiceRecord),
    id: invoice.id || `invoice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    invoiceNumber: invoiceNumber || `INV-${getLocalIsoDate().replace(/-/g, '')}`,
    invoiceDate: resolvedInvoiceDate,
    dueDate: resolvedDueDate,
    lineItems,
    subtotal,
    totalAmount,
  } satisfies InvoiceRecord;
}

function buildLocalInvoice(invoice: Partial<InvoiceRecord>) {
  const now = new Date().toISOString();
  const user = getStoredAuthUser();
  return {
    ...normalizeLocalInvoice(invoice),
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
