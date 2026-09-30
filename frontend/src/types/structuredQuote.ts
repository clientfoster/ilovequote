export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag?: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
];

export interface TaxConfiguration {
  taxType: 'GST (India)' | 'VAT' | 'Sales Tax' | 'None';
  placeOfSupply: string;
  gstType: 'IGST' | 'CGST & SGST';
  hasCess: boolean;
  cessPercent: number;
  isReverseCharge: boolean;
}

export interface QuoteColumnConfig {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER';
  visible: boolean;
  isCustom?: boolean;
}

export interface ShippingDetails {
  enabled: boolean;
  shippedFromAddress: string;
  shippedToName: string;
  shippedToAddress: string;
  transportMode: string;
  transporterName: string;
  vehicleOrTrackingNumber: string;
}

export interface StructuredQuoteItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  hsnSac?: string;
  taxPercent?: number;
  [customKey: string]: any;
}

export interface StructuredQuoteBusiness {
  name: string;
  preparedBy: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstin?: string;
  pan?: string;
  logo?: string;
}

export interface StructuredQuoteClient {
  name: string;
  contactPerson: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string;
}

export interface StructuredQuotePricing {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  cessAmount?: number;
}

export interface StructuredQuote {
  id: string;
  quoteNumber: string;
  date: string;
  validUntil: string;
  poNumber: string;
  currency: CurrencyInfo;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Converted' | 'Declined';
  source: 'manual' | 'photo' | 'audio';
  business: StructuredQuoteBusiness;
  client: StructuredQuoteClient;
  shipping?: ShippingDetails;
  taxConfig?: TaxConfiguration;
  columns?: QuoteColumnConfig[];
  items: StructuredQuoteItem[];
  pricing: StructuredQuotePricing;
  notes: string;
  terms?: string;
  conversion?: {
    isConverted: boolean;
    convertedType?: 'invoice';
    convertedId?: string;
    convertedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_COLUMNS: QuoteColumnConfig[] = [
  { id: 'col-item', name: 'Item', type: 'TEXT', visible: true, isCustom: false },
  { id: 'col-hsn', name: 'HSN/SAC', type: 'NUMBER', visible: true, isCustom: false },
  { id: 'col-gst', name: 'GST Rate', type: 'NUMBER', visible: true, isCustom: false },
  { id: 'col-qty', name: 'Quantity', type: 'NUMBER', visible: true, isCustom: false },
];

export const DEFAULT_TAX_CONFIG: TaxConfiguration = {
  taxType: 'GST (India)',
  placeOfSupply: 'Other Territory',
  gstType: 'IGST',
  hasCess: false,
  cessPercent: 0,
  isReverseCharge: false,
};

export const DEFAULT_SHIPPING_DETAILS: ShippingDetails = {
  enabled: false,
  shippedFromAddress: '',
  shippedToName: '',
  shippedToAddress: '',
  transportMode: 'Road',
  transporterName: '',
  vehicleOrTrackingNumber: '',
};

export const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh (37)',
  'Arunachal Pradesh (12)',
  'Assam (18)',
  'Bihar (10)',
  'Chhattisgarh (22)',
  'Goa (30)',
  'Gujarat (24)',
  'Haryana (06)',
  'Himachal Pradesh (02)',
  'Jharkhand (20)',
  'Karnataka (29)',
  'Kerala (32)',
  'Madhya Pradesh (23)',
  'Maharashtra (27)',
  'Manipur (14)',
  'Meghalaya (17)',
  'Mizoram (15)',
  'Nagaland (13)',
  'Odisha (21)',
  'Punjab (03)',
  'Rajasthan (08)',
  'Sikkim (11)',
  'Tamil Nadu (33)',
  'Telangana (36)',
  'Tripura (16)',
  'Uttar Pradesh (09)',
  'Uttarakhand (05)',
  'West Bengal (19)',
  'Andaman and Nicobar Islands (35)',
  'Chandigarh (04)',
  'Dadra and Nagar Haveli and Daman and Diu (26)',
  'Delhi (07)',
  'Jammu and Kashmir (01)',
  'Ladakh (38)',
  'Lakshadweep (31)',
  'Puducherry (34)',
  'Other Territory',
];

export const createDefaultStructuredQuote = (): StructuredQuote => {
  const today = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(today.getDate() + 7);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return {
    id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    quoteNumber: `QT-${String(Math.floor(100 + Math.random() * 900))}`,
    date: formatDate(today),
    validUntil: formatDate(validUntilDate),
    poNumber: '',
    currency: SUPPORTED_CURRENCIES[0], // INR
    status: 'Draft',
    source: 'manual',
    business: {
      name: '',
      preparedBy: '',
      address: '',
      phone: '',
      email: '',
      website: '',
    },
    client: {
      name: '',
      contactPerson: '',
      address: '',
      phone: '',
      email: '',
    },
    shipping: { ...DEFAULT_SHIPPING_DETAILS },
    taxConfig: { ...DEFAULT_TAX_CONFIG },
    columns: DEFAULT_COLUMNS.map((col) => ({ ...col })),
    items: [
      {
        id: `item-${Date.now()}-1`,
        name: '',
        description: '',
        hsnSac: '',
        taxPercent: 18,
        unitPrice: 0,
        quantity: 1,
        amount: 0,
      },
      {
        id: `item-${Date.now()}-2`,
        name: '',
        description: '',
        hsnSac: '',
        taxPercent: 18,
        unitPrice: 0,
        quantity: 1,
        amount: 0,
      },
      {
        id: `item-${Date.now()}-3`,
        name: '',
        description: '',
        hsnSac: '',
        taxPercent: 18,
        unitPrice: 0,
        quantity: 1,
        amount: 0,
      },
    ],
    pricing: {
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 18,
      taxAmount: 0,
      totalAmount: 0,
    },
    notes: '',
    terms: '1. Quotation is valid for 7 days from the date of issue.\n2. Payment terms: 50% advance, balance on delivery.\n3. Goods or services once delivered cannot be returned.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Recalculates pricing summary from line items, discount %, and tax %
 */
export function calculateStructuredQuotePricing(
  items: StructuredQuoteItem[],
  discountPercent = 0,
  taxPercent = 0,
  cessPercent = 0
): StructuredQuotePricing {
  const subtotal = items.reduce((sum, item) => {
    const itemAmount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + itemAmount;
  }, 0);

  const safeDiscountPercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const discountAmount = Number(((subtotal * safeDiscountPercent) / 100).toFixed(2));
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const safeTaxPercent = Math.max(0, Number(taxPercent) || 0);
  const taxAmount = Number(((discountedSubtotal * safeTaxPercent) / 100).toFixed(2));

  const safeCessPercent = Math.max(0, Number(cessPercent) || 0);
  const cessAmount = Number(((discountedSubtotal * safeCessPercent) / 100).toFixed(2));

  const totalAmount = Number((discountedSubtotal + taxAmount + cessAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountPercent: safeDiscountPercent,
    discountAmount,
    taxPercent: safeTaxPercent,
    taxAmount,
    cessAmount,
    totalAmount,
  };
}

/**
 * Direct 1-to-1 conversion from a Structured Quote to an Invoice Draft (for CreateInvoicePage)
 */
export function convertQuoteToInvoiceDraft(quote: StructuredQuote) {
  return {
    invoiceNumber: `INV-${quote.quoteNumber.replace(/^QT-?/i, '')}`,
    subtitle: `Converted from Quote ${quote.quoteNumber}`,
    showSubtitle: true,
    invoiceDate: quote.date,
    dueDate: quote.validUntil,
    showDueDate: true,
    clientId: quote.client.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 10),
    clientName: quote.client.name || 'Client',
    logoName: quote.business.logo || '',
    businessName: quote.business.name || '',
    businessAddress: quote.business.address || '',
    businessCity: '',
    businessCountry: 'India',
    businessPostal: '',
    gstin: quote.business.gstin || '',
    pan: quote.business.pan || '',
    email: quote.business.email || '',
    billedToCompany: quote.client.name || '',
    billedToAddress: quote.client.address || '',
    billedToCity: '',
    billedToCountry: 'India',
    billedToPostal: '',
    shippingEnabled: quote.shipping?.enabled || false,
    transportMode: quote.shipping?.transportMode || '',
    transporter: quote.shipping?.transporterName || '',
    distanceKm: '',
    currency: `${quote.currency.code} (${quote.currency.code}, ${quote.currency.symbol})`,
    lineItems: quote.items
      .filter((item) => item.name.trim() || item.unitPrice > 0)
      .map((item, index) => ({
        id: `inv-item-${Date.now()}-${index}`,
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || 1,
        rate: item.unitPrice || 0,
        tax: item.taxPercent || quote.pricing.taxPercent || 0,
      })),
    discountValue: quote.pricing.discountPercent || 0,
    discountType: '%' as const,
    notes: quote.notes || '',
    terms: (quote.terms || '')
      .split('\n')
      .filter(Boolean)
      .map((t, idx) => ({ id: `term-${idx}`, text: t })),
    recurring: false,
    hidePlaceOfSupply: false,
    addOriginalImages: false,
    fullWidthDescription: false,
    accountHolderName: quote.business.name || '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branchName: '',
    accountType: 'Current',
    upiId: '',
    qrImageName: '',
    paymentNotes: '',
  };
}
