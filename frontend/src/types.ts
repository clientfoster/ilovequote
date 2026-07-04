export type TaxType = 'GSTIN' | 'VAT' | 'PAN' | 'Other';

export interface SocialLink {
  platform: string;
  url: string;
  isCustom?: boolean;
}

export interface BusinessFormValues {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  logo: string; // Base64 data URL
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxType: TaxType;
  taxId: string;
  socialLinks: SocialLink[];
  businessSlug: string;
}

export interface StepItem {
  id: number;
  name: string;
  label: string;
  status: 'current' | 'upcoming' | 'completed';
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ClientDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ClientFormValues {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  taxIdType: 'GSTIN' | 'VAT' | 'PAN' | 'Other';
  taxId: string;
  poNumber: string;
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AdditionalDetails {
  taxIdType: 'GSTIN' | 'VAT' | 'PAN' | 'Other';
  taxId: string;
  poNumber: string;
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Quote {
  id: string;
  shareToken?: string;
  quoteNumber: string;
  date: string;
  expiryDate: string;
  status: 'Draft' | 'Completed';
  businessDetails: BusinessFormValues;
  clientDetails: ClientDetails;
  clientLogo?: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  terms: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  taxIdType: 'GSTIN' | 'VAT' | 'PAN' | 'Other';
  taxId: string;
  poNumber: string;
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes?: string;
  ownerUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  subtitle: string;
  showSubtitle: boolean;
  invoiceDate: string;
  dueDate: string;
  showDueDate: boolean;
  clientId: string;
  clientName: string;
  businessName: string;
  logoData: string;
  billedToCompany: string;
  billedToPhone: string;
  billedToAddress: string;
  billedToCity: string;
  billedToCountry: string;
  billedToPostal: string;
  currency: string;
  lineItems: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    rate: number;
    tax: number;
    amount: number;
  }>;
  discountValue: number;
  discountType: '%' | 'Flat';
  discountAmount: number;
  subtotal: number;
  totalAmount: number;
  notes: string;
  terms: Array<{ id: string; text: string }>;
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
  status: 'Draft' | 'Completed';
  ownerUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettings {
  defaultGstPercent: number;
  defaultTerms: string;
  businessDefaults: Partial<BusinessFormValues>;
  themePreference: 'Light' | 'Dark' | 'Blue' | 'Slate';
}

export type ItemDiscountType = 'None' | 'Percentage' | 'Flat';

export interface ItemQuoteItem {
  id: string;
  name: string;
  price: number;
  description: string;
  complimentary: boolean;
  quantity: number;
  unit: string;
  discountType: ItemDiscountType;
  discountValue: number;
  gstRate: number;
  taxInclusive: boolean;
  icon: string;
}

export interface ItemQuotationMeta {
  quotationNumber: string;
  clientName: string;
  clientEmail: string;
  businessName: string;
  businessEmail: string;
  date: string;
  validUntil: string;
  currency: string;
}

export interface ItemCalculationResult {
  subtotal: number;
  discountTotal: number;
  gstTotal: number;
  grandTotal: number;
}
