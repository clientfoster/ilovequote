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

export interface StructuredQuoteItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  hsnSac?: string;
  taxPercent?: number;
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
    items: [
      {
        id: `item-${Date.now()}-1`,
        name: '',
        description: '',
        unitPrice: 0,
        quantity: 1,
        amount: 0,
      },
      {
        id: `item-${Date.now()}-2`,
        name: '',
        description: '',
        unitPrice: 0,
        quantity: 1,
        amount: 0,
      },
      {
        id: `item-${Date.now()}-3`,
        name: '',
        description: '',
        unitPrice: 0,
        quantity: 1,
        amount: 0,
      },
    ],
    pricing: {
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 0,
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
  taxPercent = 0
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

  const totalAmount = Number((discountedSubtotal + taxAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountPercent: safeDiscountPercent,
    discountAmount,
    taxPercent: safeTaxPercent,
    taxAmount,
    totalAmount,
  };
}

/**
 * Direct 1-to-1 conversion from a Structured Quote to an Invoice Draft (for CreateInvoicePage)
 * Allows conversion without rebuilding or re-entering any data.
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
    shippingEnabled: false,
    transportMode: '',
    transporter: '',
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
