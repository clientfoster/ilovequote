import { useEffect, useState } from 'react';
import { AUTH_STATE_EVENT, getScopedStorageKey, isAuthenticated } from './auth';

export type InvoiceLineItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
};

export type InvoiceTerm = {
  id: string;
  text: string;
};

export type InvoiceExtraField = {
  id: string;
  label: string;
  value: string;
};

export type InvoiceDraft = {
  invoiceNumber: string;
  subtitle: string;
  showSubtitle: boolean;
  invoiceDate: string;
  dueDate: string;
  showDueDate: boolean;
  showCustomFields: boolean;
  customFields: InvoiceExtraField[];
  showExtraFields: boolean;
  showShippingExtraFields: boolean;
  showTaxItemsSection: boolean;
  showTax: boolean;
  clientId: string;
  clientName: string;
  logoName: string;
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessCountry: string;
  businessPostal: string;
  businessPhone: string;
  gstin: string;
  pan: string;
  email: string;
  billedToCompany: string;
  billedToPhone: string;
  billedToAddress: string;
  billedToCity: string;
  billedToCountry: string;
  billedToPostal: string;
  shippingEnabled: boolean;
  transportMode: string;
  transporter: string;
  distanceKm: string;
  currency: string;
  lineItems: InvoiceLineItem[];
  discountValue: number;
  discountType: '%' | 'Flat';
  notes: string;
  terms: InvoiceTerm[];
  recurring: boolean;
  hidePlaceOfSupply: boolean;
  addOriginalImages: boolean;
  fullWidthDescription: boolean;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branchName: string;
  accountType: string;
  upiId: string;
  qrImageName: string;
  paymentNotes: string;
  draftVersion?: number;
};

const STORAGE_KEY = 'ilovequote_invoice_draft_v1';
const DRAFT_VERSION = 2;

function getInvoiceDraftStorageKey() {
  return getScopedStorageKey(STORAGE_KEY);
}

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const defaultInvoiceDraft: InvoiceDraft = {
  invoiceNumber: 'INV00234',
  subtitle: '',
  showSubtitle: false,
  invoiceDate: '2024-01-17',
  dueDate: '2024-01-31',
  showDueDate: false,
  showCustomFields: false,
  customFields: [],
  showExtraFields: false,
  showShippingExtraFields: false,
  showTaxItemsSection: true,
  showTax: false,
  clientId: '',
  clientName: '',
  logoName: '',
  businessName: '',
  businessAddress: '',
  businessCity: '',
  businessCountry: '',
  businessPostal: '',
  businessPhone: '',
  gstin: '',
  pan: '',
  email: '',
  billedToCompany: '',
  billedToPhone: '',
  billedToAddress: '',
  billedToCity: '',
  billedToCountry: '',
  billedToPostal: '',
  shippingEnabled: false,
  transportMode: '',
  transporter: '',
  distanceKm: '',
  currency: 'INR (INR, Rs)',
  lineItems: [
    { id: makeId('item'), name: 'Item 1', description: 'Description', quantity: 1, rate: 100, tax: 0 },
    { id: makeId('item'), name: 'Item 2', description: 'Description', quantity: 1, rate: 50, tax: 0 },
    { id: makeId('item'), name: 'Item 3', description: 'Description', quantity: 1, rate: 75, tax: 0 },
  ],
  discountValue: 10,
  discountType: '%',
  notes: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ut nisl tempus massa blandit luctus.',
  terms: [
    { id: makeId('term'), text: 'Please pay within 15 days from the date of invoice. overdue interest @ 14% will be charged on delayed payments.' },
    { id: makeId('term'), text: 'Please quote invoice number when remitting funds.' },
  ],
  recurring: false,
  hidePlaceOfSupply: true,
  addOriginalImages: false,
  fullWidthDescription: false,
  accountHolderName: 'Sakshi Enterprises',
  bankName: 'HDFC Bank',
  accountNumber: 'XXXXXX452178',
  ifsc: 'HDFC0001245',
  branchName: 'Surat Main Branch',
  accountType: 'Current Account',
  upiId: 'sakshi@upi',
  qrImageName: '',
  paymentNotes: 'Kindly make payment within 15 days. Use the invoice number as your payment reference. UPI and bank transfer are both accepted.',
  draftVersion: DRAFT_VERSION,
};

export function loadInvoiceDraft(): InvoiceDraft {
  try {
    const raw = localStorage.getItem(getInvoiceDraftStorageKey()) || (isAuthenticated() ? localStorage.getItem(STORAGE_KEY) : null);
    if (!raw) return defaultInvoiceDraft;
    const parsed = JSON.parse(raw) as Partial<InvoiceDraft>;
    const isCurrentSchema = parsed.draftVersion === DRAFT_VERSION;
    const draft: InvoiceDraft = {
      ...defaultInvoiceDraft,
      ...parsed,
      showDueDate: isCurrentSchema ? parsed.showDueDate ?? defaultInvoiceDraft.showDueDate : false,
      showCustomFields: isCurrentSchema ? parsed.showCustomFields ?? defaultInvoiceDraft.showCustomFields : false,
      showExtraFields: isCurrentSchema ? parsed.showExtraFields ?? defaultInvoiceDraft.showExtraFields : false,
      showShippingExtraFields: isCurrentSchema ? parsed.showShippingExtraFields ?? defaultInvoiceDraft.showShippingExtraFields : false,
      showTaxItemsSection: parsed.showTaxItemsSection ?? defaultInvoiceDraft.showTaxItemsSection,
      showTax: parsed.showTax ?? defaultInvoiceDraft.showTax,
      shippingEnabled: isCurrentSchema ? parsed.shippingEnabled ?? defaultInvoiceDraft.shippingEnabled : false,
      lineItems: Array.isArray(parsed.lineItems) && parsed.lineItems.length > 0 ? parsed.lineItems : defaultInvoiceDraft.lineItems,
      terms: Array.isArray(parsed.terms) && parsed.terms.length > 0 ? parsed.terms : defaultInvoiceDraft.terms,
      customFields: Array.isArray(parsed.customFields) ? parsed.customFields : defaultInvoiceDraft.customFields,
      draftVersion: DRAFT_VERSION,
    };
    if (!localStorage.getItem(getInvoiceDraftStorageKey()) && isAuthenticated()) {
      saveInvoiceDraft(draft);
    }
    return draft;
  } catch {
    return defaultInvoiceDraft;
  }
}

export function saveInvoiceDraft(draft: InvoiceDraft) {
  localStorage.setItem(getInvoiceDraftStorageKey(), JSON.stringify(draft));
}

export function useInvoiceDraft() {
  const [draft, setDraft] = useState<InvoiceDraft>(() => loadInvoiceDraft());

  useEffect(() => {
    saveInvoiceDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncDraft = () => setDraft(loadInvoiceDraft());
    window.addEventListener(AUTH_STATE_EVENT, syncDraft);
    window.addEventListener('storage', syncDraft);
    return () => {
      window.removeEventListener(AUTH_STATE_EVENT, syncDraft);
      window.removeEventListener('storage', syncDraft);
    };
  }, []);

  return [draft, setDraft] as const;
}

export function formatInvoiceCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getLineItemAmount(item: InvoiceLineItem, includeTax = true) {
  const subtotal = item.quantity * item.rate;
  return subtotal + subtotal * (includeTax ? item.tax / 100 : 0);
}

export function getSubTotal(items: InvoiceLineItem[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function getDiscountAmount(draft: InvoiceDraft) {
  const subtotal = getSubTotal(draft.lineItems);
  return draft.discountType === '%' ? subtotal * (draft.discountValue / 100) : draft.discountValue;
}

export function getInvoiceTotal(draft: InvoiceDraft, includeTax = true) {
  const itemsTotal = draft.lineItems.reduce((sum, item) => sum + getLineItemAmount(item, includeTax), 0);
  return itemsTotal - getDiscountAmount(draft);
}

export function makeInvoiceLineItem(): InvoiceLineItem {
  return { id: makeId('item'), name: 'Item', description: 'Description', quantity: 1, rate: 0, tax: 0 };
}

export function makeInvoiceTerm(): InvoiceTerm {
  return { id: makeId('term'), text: 'New term' };
}

export function makeInvoiceExtraField(): InvoiceExtraField {
  return { id: makeId('field'), label: '', value: '' };
}
