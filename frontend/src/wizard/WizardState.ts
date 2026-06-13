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
export const DEMO_BUSINESS_NAME = 'Semixon Technologies';
export const DEMO_CLIENT_NAME = 'Swanish Healthcare Pvt. Ltd.';
export const DEMO_CLIENT_CONTACT = 'Dr. Swanish';
export const DEMO_BUSINESS_TAGLINE = 'We build digital solutions that help businesses grow.';
export const DEMO_BUSINESS_EMAIL = 'hello@semixon.com';
export const DEMO_BUSINESS_PHONE = '+91 98765 43210';
export const DEMO_BUSINESS_WEBSITE = 'https://www.semixon.com';
export const DEMO_BUSINESS_ADDRESS = '123, Digital Tower';
export const DEMO_BUSINESS_CITY = 'Kozhikode';
export const DEMO_BUSINESS_STATE = 'Kerala';
export const DEMO_BUSINESS_ZIP = '673006';
export const DEMO_BUSINESS_COUNTRY = 'India';
export const DEMO_BUSINESS_TAX_ID = '32ABCDE1234F1Z5';
export const DEMO_BUSINESS_SLUG = 'semixon-technologies';
export const DEMO_CLIENT_EMAIL = 'info@swanishhealthcare.com';
export const DEMO_CLIENT_PHONE = '+91 98462 68462';
export const DEMO_CLIENT_WEBSITE = 'https://www.swanishhealthcare.com';
export const DEMO_CLIENT_ADDRESS = 'Kozhikode, Kerala, India\n673006, India';

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
  companyName: DEMO_BUSINESS_NAME,
  tagline: DEMO_BUSINESS_TAGLINE,
  email: DEMO_BUSINESS_EMAIL,
  phone: DEMO_BUSINESS_PHONE,
  website: DEMO_BUSINESS_WEBSITE,
  logo: '',
  address: DEMO_BUSINESS_ADDRESS,
  city: DEMO_BUSINESS_CITY,
  state: DEMO_BUSINESS_STATE,
  zipCode: DEMO_BUSINESS_ZIP,
  country: DEMO_BUSINESS_COUNTRY,
  taxType: 'GSTIN',
  taxId: DEMO_BUSINESS_TAX_ID,
  socialLinks: [
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/company/semixon' },
    { platform: 'Instagram', url: 'https://www.instagram.com/semixon' },
  ],
  businessSlug: DEMO_BUSINESS_SLUG,
};

export const DEFAULT_CLIENT_VALUES: ClientFormValues = {
  companyName: DEMO_CLIENT_NAME,
  contactPerson: DEMO_CLIENT_CONTACT,
  email: DEMO_CLIENT_EMAIL,
  phone: DEMO_CLIENT_PHONE,
  website: DEMO_CLIENT_WEBSITE,
  taxIdType: 'GSTIN',
  taxId: DEMO_BUSINESS_TAX_ID,
  poNumber: 'PO12345',
  billingAddress: DEMO_CLIENT_ADDRESS,
  city: 'Kozhikode',
  state: 'Kerala',
  zipCode: DEMO_BUSINESS_ZIP,
  country: DEMO_BUSINESS_COUNTRY,
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultGstPercent: 18,
  defaultTerms: '1. Please pay within 15 days of invoice date.\n2. Goods once sold cannot be returned.\n3. Thank you for your business!',
  businessDefaults: {},
  themePreference: 'Light',
};

export const DEFAULT_ITEM_META: ItemQuotationMeta = {
  quotationNumber: 'Q-2024-001',
  clientName: DEMO_CLIENT_NAME,
  clientEmail: DEMO_CLIENT_EMAIL,
  businessName: DEMO_BUSINESS_NAME,
  businessEmail: DEMO_BUSINESS_EMAIL,
  date: '2024-05-16',
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
