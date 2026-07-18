import { useEffect, useState } from 'react';
import { AUTH_STATE_EVENT, getScopedStorageKey, getScopedStorageKeyForScope, isAuthenticated } from './auth';

export type InvoiceLineItem = {
  id: string;
  name: string;
  description: string;
  hsnSac?: string;
  imageName?: string;
  imageData?: string;
  quantity: number;
  rate: number;
  tax: number;
  discount?: number;
  customValues?: Record<string, string | number>;
};

export type InvoiceGstType = 'CGST_SGST' | 'IGST';

export type InvoiceLineItemColumns = {
  hsnSac: boolean;
  gstRate: boolean;
  quantity: boolean;
  rate: boolean;
  amount: boolean;
  discount: boolean;
  cgst: boolean;
  sgst: boolean;
  igst: boolean;
  total: boolean;
};

export type InvoiceFormulaConfig = {
  gstRate: string;
  quantity: string;
  rate: string;
  discount: string;
  amount: string;
  tax: string;
  cgst: string;
  sgst: string;
  igst: string;
  total: string;
};

export type InvoiceColumnType = 'TEXT' | 'NUMBER' | 'CURRENCY' | 'FORMULA';
export type InvoiceColumnTypes = Record<keyof InvoiceLineItemColumns, InvoiceColumnType>;

export type InvoiceColumnLabels = Record<keyof InvoiceLineItemColumns, string>;
export type InvoiceColumnKey = keyof InvoiceLineItemColumns;
export type InvoiceCustomColumn = { id: string; label: string; type: 'TEXT' | 'NUMBER' | 'CURRENCY'; visible: boolean };
export type InvoiceColumnId = string;
export const DEFAULT_INVOICE_COLUMN_ORDER: InvoiceColumnId[] = ['hsnSac', 'gstRate', 'quantity', 'rate', 'amount', 'discount', 'cgst', 'sgst', 'igst', 'total'];

export type InvoiceTerm = {
  id: string;
  text: string;
};

export type InvoiceExtraField = {
  id: string;
  label: string;
  value: string;
};

export type InvoiceAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
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
  taxType: string;
  gstType: InvoiceGstType;
  placeOfSupply: string;
  reverseCharge: boolean;
  cessEnabled: boolean;
  cessRate: number;
  clientId: string;
  clientName: string;
  logoName: string;
  logoData: string;
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
  currency: string;
  lineItemColumns: InvoiceLineItemColumns;
  lineItemColumnOrder: InvoiceColumnId[];
  customLineItemColumns: InvoiceCustomColumn[];
  lineItemColumnLabels: InvoiceColumnLabels;
  lineItemColumnTypes: InvoiceColumnTypes;
  lineItemFormulas: InvoiceFormulaConfig;
  lineItems: InvoiceLineItem[];
  discountValue: number;
  discountType: '%' | 'Flat';
  notes: string;
  attachments: InvoiceAttachment[];
  signatureName: string;
  signatureData: string;
  terms: InvoiceTerm[];
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branchName: string;
  accountType: string;
  upiId: string;
  qrImageName: string;
  qrImageData: string;
  paymentNotes: string;
  draftVersion?: number;
};

const STORAGE_KEY = 'ilovequote_invoice_draft_v1';
const DRAFT_VERSION = 2;

function getInvoiceDraftStorageKey() {
  return getScopedStorageKey(STORAGE_KEY);
}

function getGuestInvoiceDraftStorageKey() {
  return getScopedStorageKeyForScope(STORAGE_KEY, 'guest');
}

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function getLocalIsoDate(date = new Date()) {
  const localTime = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localTime).toISOString().slice(0, 10);
}

function addDaysToIsoDate(isoDate: string, days: number) {
  const next = new Date(`${isoDate}T00:00:00`);
  next.setDate(next.getDate() + days);
  return getLocalIsoDate(next);
}

export const defaultInvoiceDraft: InvoiceDraft = {
  invoiceNumber: '',
  subtitle: '',
  showSubtitle: false,
  invoiceDate: '',
  dueDate: '',
  showDueDate: false,
  showCustomFields: false,
  customFields: [],
  showExtraFields: false,
  showShippingExtraFields: false,
  showTaxItemsSection: true,
  showTax: true,
  taxType: 'GST (India)',
  gstType: 'CGST_SGST',
  placeOfSupply: 'Other Territory',
  reverseCharge: false,
  cessEnabled: false,
  cessRate: 0,
  clientId: '',
  clientName: '',
  logoName: '',
  logoData: '',
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
  currency: 'INR (INR, Rs)',
  lineItemColumns: {
    hsnSac: true,
    gstRate: true,
    quantity: true,
    rate: true,
    amount: true,
    discount: false,
    cgst: true,
    sgst: true,
    igst: true,
    total: true,
  },
  lineItemColumnOrder: [...DEFAULT_INVOICE_COLUMN_ORDER],
  customLineItemColumns: [],
  lineItemColumnLabels: {
    hsnSac: 'HSN/SAC',
    gstRate: 'GST Rate',
    quantity: 'Quantity',
    rate: 'Rate',
    amount: 'Amount',
    discount: 'Discount',
    cgst: 'CGST',
    sgst: 'SGST',
    igst: 'IGST',
    total: 'Total',
  },
  lineItemColumnTypes: { hsnSac: 'TEXT', gstRate: 'NUMBER', quantity: 'NUMBER', rate: 'CURRENCY', amount: 'FORMULA', discount: 'CURRENCY', cgst: 'FORMULA', sgst: 'FORMULA', igst: 'FORMULA', total: 'FORMULA' },
  lineItemFormulas: {
    gstRate: '',
    quantity: '',
    rate: '',
    discount: '',
    amount: 'D1 * E1',
    tax: 'F1 * C1 / 100',
    cgst: 'F1 * C1 / 200',
    sgst: 'F1 * C1 / 200',
    igst: 'F1 * C1 / 100',
    total: 'F1 + G1 + H1',
  },
  lineItems: [
    { id: makeId('item'), name: '', description: '', hsnSac: '', imageName: '', imageData: '', quantity: 1, rate: 0, tax: 18, discount: 0 },
  ],
  discountValue: 0,
  discountType: '%',
  notes: '',
  attachments: [],
  signatureName: '',
  signatureData: '',
  terms: [],
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  branchName: '',
  accountType: '',
  upiId: '',
  qrImageName: '',
  qrImageData: '',
  paymentNotes: '',
  draftVersion: DRAFT_VERSION,
};

export function loadInvoiceDraft(): InvoiceDraft {
  try {
    const currentScopedKey = getInvoiceDraftStorageKey();
    const guestScopedKey = getGuestInvoiceDraftStorageKey();
    const currentRaw = localStorage.getItem(currentScopedKey);
    const guestRaw = currentRaw ? null : localStorage.getItem(guestScopedKey);
    const legacyRaw = currentRaw || guestRaw ? null : localStorage.getItem(STORAGE_KEY);
    const raw = currentRaw || guestRaw || legacyRaw;
    if (!raw) return defaultInvoiceDraft;

    const sourceKey = currentRaw ? currentScopedKey : guestRaw ? guestScopedKey : legacyRaw ? STORAGE_KEY : currentScopedKey;
    const parsed = JSON.parse(raw) as Partial<InvoiceDraft>;
    const isCurrentSchema = parsed.draftVersion === DRAFT_VERSION;
    const extraFieldsEnabled = Boolean(parsed.showCustomFields || parsed.showShippingExtraFields || parsed.showExtraFields);
    const isLegacySeed = !isCurrentSchema
      && parsed.invoiceNumber === 'INV00234'
      && parsed.invoiceDate === '2024-01-17'
      && parsed.dueDate === '2024-01-31';
    const hasLegacyDemoItems =
      Array.isArray(parsed.lineItems)
      && parsed.lineItems.length === 3
      && parsed.lineItems.every((item, index) =>
        item?.name === `Item ${index + 1}` && item?.description === 'Description',
      );
    const hasLegacyNotesSeed =
      typeof parsed.notes === 'string'
      && parsed.notes.trim() === 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ut nisl tempus massa blandit luctus.';
    const invoiceDate = isLegacySeed ? defaultInvoiceDraft.invoiceDate : (parsed.invoiceDate || defaultInvoiceDraft.invoiceDate);
    const dueDate = isLegacySeed ? defaultInvoiceDraft.dueDate : (parsed.dueDate || defaultInvoiceDraft.dueDate);
    const draft: InvoiceDraft = {
      ...defaultInvoiceDraft,
      ...parsed,
      invoiceDate,
      dueDate,
      showDueDate: isCurrentSchema ? parsed.showDueDate ?? defaultInvoiceDraft.showDueDate : false,
      showCustomFields: extraFieldsEnabled,
      showExtraFields: extraFieldsEnabled,
      showShippingExtraFields: extraFieldsEnabled,
      logoData: typeof parsed.logoData === 'string' ? parsed.logoData : defaultInvoiceDraft.logoData,
      showTaxItemsSection: parsed.showTaxItemsSection ?? defaultInvoiceDraft.showTaxItemsSection,
      showTax: parsed.showTax ?? defaultInvoiceDraft.showTax,
      taxType: typeof parsed.taxType === 'string' && parsed.taxType.trim() ? parsed.taxType : defaultInvoiceDraft.taxType,
      gstType: parsed.gstType === 'IGST' ? 'IGST' : 'CGST_SGST',
      notes: hasLegacyNotesSeed ? defaultInvoiceDraft.notes : (typeof parsed.notes === 'string' ? parsed.notes : defaultInvoiceDraft.notes),
      shippingEnabled: isCurrentSchema ? parsed.shippingEnabled ?? defaultInvoiceDraft.shippingEnabled : false,
      lineItemColumns: {
        ...defaultInvoiceDraft.lineItemColumns,
        ...(parsed.lineItemColumns || {}),
      },
      customLineItemColumns: Array.isArray(parsed.customLineItemColumns) ? parsed.customLineItemColumns.filter((column) => column && typeof column.id === 'string' && typeof column.label === 'string') : [],
      lineItemColumnOrder: (() => {
        const customIds = Array.isArray(parsed.customLineItemColumns) ? parsed.customLineItemColumns.map((column) => column?.id).filter((id): id is string => typeof id === 'string') : [];
        const allowed = [...DEFAULT_INVOICE_COLUMN_ORDER, ...customIds];
        const supplied = Array.isArray(parsed.lineItemColumnOrder) ? parsed.lineItemColumnOrder.filter((key): key is string => typeof key === 'string' && allowed.includes(key)) : [];
        return [...new Set([...supplied, ...allowed])].filter((key) => key !== 'total').concat('total');
      })(),
      lineItemColumnLabels: {
        ...defaultInvoiceDraft.lineItemColumnLabels,
        ...(parsed.lineItemColumnLabels || {}),
      },
      lineItemColumnTypes: {
        ...defaultInvoiceDraft.lineItemColumnTypes,
        ...(parsed.lineItemColumnTypes || {}),
      },
      lineItemFormulas: {
        ...defaultInvoiceDraft.lineItemFormulas,
        ...(parsed.lineItemFormulas || {}),
      },
      lineItems:
        Array.isArray(parsed.lineItems) && parsed.lineItems.length > 0 && !hasLegacyDemoItems
          ? parsed.lineItems.map((item) => ({
              ...makeInvoiceLineItem(),
              ...item,
              hsnSac: item.hsnSac || '',
              imageName: item.imageName || '',
              imageData: item.imageData || '',
              customValues: item.customValues && typeof item.customValues === 'object' ? item.customValues : {},
            }))
          : defaultInvoiceDraft.lineItems,
      terms: Array.isArray(parsed.terms) && parsed.terms.length > 0 ? parsed.terms : defaultInvoiceDraft.terms,
      customFields: Array.isArray(parsed.customFields) ? parsed.customFields : defaultInvoiceDraft.customFields,
      attachments: Array.isArray(parsed.attachments)
        ? parsed.attachments
            .filter(Boolean)
            .map((attachment) => ({
              id: typeof attachment?.id === 'string' && attachment.id.trim() ? attachment.id : makeId('attachment'),
              name: typeof attachment?.name === 'string' ? attachment.name : '',
              type: typeof attachment?.type === 'string' ? attachment.type : '',
              size: Number(attachment?.size ?? 0) || 0,
              dataUrl: typeof attachment?.dataUrl === 'string' ? attachment.dataUrl : '',
            }))
        : defaultInvoiceDraft.attachments,
      signatureName: typeof parsed.signatureName === 'string' ? parsed.signatureName : defaultInvoiceDraft.signatureName,
      signatureData: typeof parsed.signatureData === 'string' ? parsed.signatureData : defaultInvoiceDraft.signatureData,
      draftVersion: DRAFT_VERSION,
    };
    if (isAuthenticated() && sourceKey !== currentScopedKey) {
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

export function clearInvoiceDraftStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(getInvoiceDraftStorageKey());
  localStorage.removeItem(getGuestInvoiceDraftStorageKey());
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

export function formatInvoiceCurrency(amount: number, currencyLabel = 'INR') {
  const currency = currencyLabel.toUpperCase().match(/\b[A-Z]{3}\b/)?.[0] || 'INR';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  }
}

type InvoiceFormulaContext = {
  quantity: number;
  rate: number;
  gstRate: number;
  amount: number;
  tax: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
};

export type CalculatedInvoiceLine = {
  quantity: number;
  rate: number;
  gstRate: number;
  discount: number;
  amount: number;
  tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

function evaluateInvoiceFormula(expression: string, context: InvoiceFormulaContext) {
  const replacements: Array<[RegExp, number]> = [
    [/GST%/gi, context.gstRate],
    [/C1/gi, context.gstRate],
    [/D1/gi, context.quantity],
    [/E1/gi, context.rate],
    [/F1/gi, context.amount],
    [/G1/gi, context.cgst || context.igst],
    [/H1/gi, context.sgst],
    [/Quantity/gi, context.quantity],
    [/Discount/gi, context.discount],
    [/Amount/gi, context.amount],
    [/Rate/gi, context.rate],
    [/Tax/gi, context.tax],
  ];
  const numericExpression = replacements.reduce(
    (current, [token, value]) => current.replace(token, `(${Number.isFinite(value) ? value : 0})`),
    expression.replace(/[×x]/g, '*').replace(/÷/g, '/'),
  );
  if (!numericExpression.trim() || !/^[\d\s+\-*/().]+$/.test(numericExpression)) return 0;
  try {
    const result = Function(`"use strict"; return (${numericExpression});`)() as number;
    return Number.isFinite(result) ? Math.max(0, result) : 0;
  } catch {
    return 0;
  }
}

export function calculateInvoiceLine(
  item: InvoiceLineItem,
  formulas: InvoiceFormulaConfig = defaultInvoiceDraft.lineItemFormulas,
  gstType: InvoiceGstType = 'CGST_SGST',
  includeTax = true,
  columnTypes: InvoiceColumnTypes = defaultInvoiceDraft.lineItemColumnTypes,
): CalculatedInvoiceLine {
  const context: InvoiceFormulaContext = {
    quantity: Math.max(1, Number(item.quantity) || 1),
    rate: Math.max(0, Number(item.rate) || 0),
    gstRate: includeTax ? Math.min(100, Math.max(0, Number(item.tax) || 0)) : 0,
    amount: 0,
    tax: 0,
    discount: Math.max(0, Number(item.discount) || 0),
    cgst: 0,
    sgst: 0,
    igst: 0,
  };
  if (columnTypes.quantity === 'FORMULA' && formulas.quantity.trim()) context.quantity = Math.max(1, evaluateInvoiceFormula(formulas.quantity, context));
  if (columnTypes.rate === 'FORMULA' && formulas.rate.trim()) context.rate = evaluateInvoiceFormula(formulas.rate, context);
  if (columnTypes.gstRate === 'FORMULA' && formulas.gstRate.trim()) context.gstRate = includeTax ? Math.min(100, evaluateInvoiceFormula(formulas.gstRate, context)) : 0;
  if (columnTypes.discount === 'FORMULA' && formulas.discount.trim()) context.discount = evaluateInvoiceFormula(formulas.discount, context);
  context.amount = evaluateInvoiceFormula(formulas.amount, context);
  context.tax = includeTax ? evaluateInvoiceFormula(formulas.tax, context) : 0;
  context.cgst = includeTax && gstType === 'CGST_SGST' ? evaluateInvoiceFormula(formulas.cgst, context) : 0;
  context.sgst = includeTax && gstType === 'CGST_SGST' ? evaluateInvoiceFormula(formulas.sgst, context) : 0;
  context.igst = includeTax && gstType === 'IGST' ? evaluateInvoiceFormula(formulas.igst, context) : 0;
  const total = evaluateInvoiceFormula(formulas.total, context);
  return {
    quantity: context.quantity,
    rate: context.rate,
    gstRate: context.gstRate,
    discount: context.discount,
    amount: context.amount,
    tax: context.tax,
    cgst: context.cgst,
    sgst: context.sgst,
    igst: context.igst,
    total,
  };
}

export function getLineItemAmount(
  item: InvoiceLineItem,
  includeTax = true,
  formulas: InvoiceFormulaConfig = defaultInvoiceDraft.lineItemFormulas,
  gstType: InvoiceGstType = 'CGST_SGST',
  columnTypes: InvoiceColumnTypes = defaultInvoiceDraft.lineItemColumnTypes,
) {
  return calculateInvoiceLine(item, formulas, gstType, includeTax, columnTypes).total;
}

export function getSubTotal(items: InvoiceLineItem[], formulas: InvoiceFormulaConfig = defaultInvoiceDraft.lineItemFormulas, columnTypes: InvoiceColumnTypes = defaultInvoiceDraft.lineItemColumnTypes) {
  return items.reduce((sum, item) => sum + calculateInvoiceLine(item, formulas, 'CGST_SGST', false, columnTypes).amount, 0);
}

export function getDiscountAmount(draft: InvoiceDraft) {
  const subtotal = getSubTotal(draft.lineItems, draft.lineItemFormulas, draft.lineItemColumnTypes);
  return draft.discountType === '%' ? subtotal * (draft.discountValue / 100) : draft.discountValue;
}

export function getInvoiceTotal(draft: InvoiceDraft, includeTax = true) {
  const itemsTotal = draft.lineItems.reduce(
    (sum, item) => sum + getLineItemAmount(item, includeTax, draft.lineItemFormulas, draft.gstType, draft.lineItemColumnTypes),
    0,
  );
  return itemsTotal - getDiscountAmount(draft);
}

export function makeInvoiceLineItem(): InvoiceLineItem {
  return { id: makeId('item'), name: '', description: '', hsnSac: '', imageName: '', imageData: '', quantity: 1, rate: 0, tax: 18, discount: 0 };
}

export function makeInvoiceTerm(): InvoiceTerm {
  return { id: makeId('term'), text: 'New term' };
}

export function makeInvoiceExtraField(): InvoiceExtraField {
  return { id: makeId('field'), label: '', value: '' };
}

export function makeInvoiceAttachment(): InvoiceAttachment {
  return { id: makeId('attachment'), name: '', type: '', size: 0, dataUrl: '' };
}
