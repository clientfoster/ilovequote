import { useEffect, useState } from 'react';

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

export type InvoiceDraft = {
  invoiceNumber: string;
  subtitle: string;
  showSubtitle: boolean;
  invoiceDate: string;
  dueDate: string;
  showDueDate: boolean;
  clientId: string;
  clientName: string;
  logoName: string;
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessCountry: string;
  businessPostal: string;
  gstin: string;
  pan: string;
  email: string;
  billedToCompany: string;
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
};

const STORAGE_KEY = 'ilovequote_invoice_draft_v1';

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const defaultInvoiceDraft: InvoiceDraft = {
  invoiceNumber: 'INV00234',
  subtitle: '',
  showSubtitle: false,
  invoiceDate: '2024-01-17',
  dueDate: '2024-01-31',
  showDueDate: true,
  clientId: '015845',
  clientName: 'Select a Client',
  logoName: '',
  businessName: 'Sakshi',
  businessAddress: 'Surat, Gujarat, India 395017',
  businessCity: 'Surat',
  businessCountry: 'India',
  businessPostal: '395017',
  gstin: '24BFTPS4040D1ZF',
  pan: 'BFTPS4040D',
  email: 'sakshi30@gmail.com',
  billedToCompany: 'Company Name',
  billedToAddress: 'Address',
  billedToCity: 'City',
  billedToCountry: 'Country',
  billedToPostal: 'Postal',
  shippingEnabled: true,
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
};

export function loadInvoiceDraft(): InvoiceDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultInvoiceDraft;
    const parsed = JSON.parse(raw) as Partial<InvoiceDraft>;
    return {
      ...defaultInvoiceDraft,
      ...parsed,
      lineItems: Array.isArray(parsed.lineItems) && parsed.lineItems.length > 0 ? parsed.lineItems : defaultInvoiceDraft.lineItems,
      terms: Array.isArray(parsed.terms) && parsed.terms.length > 0 ? parsed.terms : defaultInvoiceDraft.terms,
    };
  } catch {
    return defaultInvoiceDraft;
  }
}

export function saveInvoiceDraft(draft: InvoiceDraft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function useInvoiceDraft() {
  const [draft, setDraft] = useState<InvoiceDraft>(() => loadInvoiceDraft());

  useEffect(() => {
    saveInvoiceDraft(draft);
  }, [draft]);

  return [draft, setDraft] as const;
}

export function formatInvoiceCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getLineItemAmount(item: InvoiceLineItem) {
  const subtotal = item.quantity * item.rate;
  return subtotal + subtotal * (item.tax / 100);
}

export function getSubTotal(items: InvoiceLineItem[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function getDiscountAmount(draft: InvoiceDraft) {
  const subtotal = getSubTotal(draft.lineItems);
  return draft.discountType === '%' ? subtotal * (draft.discountValue / 100) : draft.discountValue;
}

export function getInvoiceTotal(draft: InvoiceDraft) {
  const itemsTotal = draft.lineItems.reduce((sum, item) => sum + getLineItemAmount(item), 0);
  return itemsTotal - getDiscountAmount(draft);
}

export function makeInvoiceLineItem(): InvoiceLineItem {
  return { id: makeId('item'), name: 'Item', description: 'Description', quantity: 1, rate: 0, tax: 0 };
}

export function makeInvoiceTerm(): InvoiceTerm {
  return { id: makeId('term'), text: 'New term' };
}
