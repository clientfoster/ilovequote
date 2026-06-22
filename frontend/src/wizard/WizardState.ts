import { INITIAL_ITEMS } from '../itemData';
import { calculateQuotationTotals } from '../itemUtils';
import {
  AppSettings,
  BusinessFormValues,
  ClientFormValues,
  ItemQuoteItem,
  ItemQuotationMeta,
} from '../types';

export type QuoteWizardStep = 1 | 2 | 3 | 4;

export const BUSINESS_DRAFT_KEY = 'ilovequote_business_draft';
export const CLIENT_DRAFT_KEY = 'ilovequote_client_details';
export const CLIENT_LOGO_KEY = 'ilovequote_logo_url';
export const ITEMS_DRAFT_KEY = 'ilovequote_draft_items';
export const ITEMS_META_KEY = 'ilovequote_draft_meta';
export const QUOTES_STORAGE_KEY = 'ilovequote_saved_quotes';
export const SETTINGS_STORAGE_KEY = 'ilovequote_app_settings';
export interface WizardState {
  currentStep: QuoteWizardStep;
  businessData: BusinessFormValues;
  clientData: ClientFormValues;
  itemsData: ItemQuoteItem[];
  quotationTotals: ReturnType<typeof calculateQuotationTotals>;
  quotationMeta: ItemQuotationMeta;
  logoUrl: string | null;
  taxRate: number;
  termsAndConditions: string;
  editingQuoteId: string | null;
}

export interface WizardContextValue extends WizardState {
  setCurrentStep: (step: QuoteWizardStep) => void;
  setBusinessData: (data: BusinessFormValues) => void;
  setClientData: (data: ClientFormValues) => void;
  setItemsData: (items: ItemQuoteItem[]) => void;
  setQuotationMeta: (meta: ItemQuotationMeta) => void;
  setLogoUrl: (value: string | null) => void;
  setTaxRate: (value: number) => void;
  setTermsAndConditions: (value: string) => void;
  setEditingQuoteId: (value: string | null) => void;
}

export const DEFAULT_BUSINESS_VALUES: BusinessFormValues = {
  companyName: '',
  tagline: '',
  email: '',
  phone: '',
  website: '',
  logo: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  taxType: 'GSTIN',
  taxId: '',
  socialLinks: [],
  businessSlug: '',
};

export const DEFAULT_CLIENT_VALUES: ClientFormValues = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  website: '',
  taxIdType: 'GSTIN',
  taxId: '',
  poNumber: '',
  billingAddress: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultGstPercent: 18,
  defaultTerms: '1. Please pay within 15 days of invoice date.\n2. Goods once sold cannot be returned.\n3. Thank you for your business!',
  businessDefaults: {},
  themePreference: 'Light',
};

export const DEFAULT_ITEM_META: ItemQuotationMeta = {
  quotationNumber: '',
  clientName: '',
  clientEmail: '',
  businessName: '',
  businessEmail: '',
  date: new Date().toISOString().split('T')[0],
  validUntil: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })(),
  currency: '₹',
};

export function createDefaultWizardState(): WizardState {
  return {
    currentStep: 1,
    businessData: DEFAULT_BUSINESS_VALUES,
    clientData: DEFAULT_CLIENT_VALUES,
    itemsData: INITIAL_ITEMS,
    quotationTotals: calculateQuotationTotals(INITIAL_ITEMS),
    quotationMeta: DEFAULT_ITEM_META,
    logoUrl: null,
    taxRate: DEFAULT_SETTINGS.defaultGstPercent,
    termsAndConditions: DEFAULT_SETTINGS.defaultTerms,
    editingQuoteId: null,
  };
}

export function syncWizardTotals(items: ItemQuoteItem[]) {
  return calculateQuotationTotals(items);
}
