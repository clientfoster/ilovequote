import { ItemQuoteItem, ItemQuotationMeta } from './types';

export const INITIAL_ITEMS: ItemQuoteItem[] = [];
export const INITIAL_META: ItemQuotationMeta = {
  quotationNumber: '',
  clientName: '',
  clientEmail: '',
  businessName: '',
  businessEmail: '',
  date: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  currency: '?',
};

export interface ShortcutCard {
  id: string;
  title: string;
  description: string;
  iconName: string;
  prefillTemplate: Partial<ItemQuoteItem>;
}

export const SHORTCUT_CARDS: ShortcutCard[] = [
  {
    id: 'sc-item',
    title: 'Item Details',
    description: 'Add a standard product/service with simple pricing options.',
    iconName: 'FileText',
    prefillTemplate: {
      name: 'Custom Development Task',
      price: 15000,
      description: 'Advanced backend integration or specific frontend layout styling.',
      complimentary: false,
      quantity: 1,
      unit: 'Task',
    },
  },
  {
    id: 'sc-qty',
    title: 'Quantity & Unit',
    description: 'Custom units like Hours, Months, Pages, or Projects.',
    iconName: 'Maximize2',
    prefillTemplate: {
      name: 'Dedicated Consultation Support',
      price: 2500,
      description: 'Hourly consulting, training sessions or systems auditing.',
      complimentary: false,
      quantity: 8,
      unit: 'Hours',
    },
  },
  {
    id: 'sc-discount',
    title: 'Discount Strategies',
    description: 'Apply standard percent or flat rate discounts.',
    iconName: 'Percent',
    prefillTemplate: {
      name: 'Branding & Logo Package',
      price: 12000,
      description: 'High-resolution agency-level logo iterations with standard brand assets.',
      complimentary: false,
      quantity: 1,
      unit: 'Package',
      discountType: 'Percentage',
      discountValue: 20,
    },
  },
  {
    id: 'sc-gst',
    title: 'GST / Custom Tax Rates',
    description: 'Fully configure standard GST brackets.',
    iconName: 'IndianRupee',
    prefillTemplate: {
      name: 'Corporate Training Workshop',
      price: 45000,
      description: '2-Day intensive React & design system bootcamp for engineering squads.',
      complimentary: false,
      quantity: 1,
      unit: 'Batch',
      gstRate: 18,
      taxInclusive: false,
    },
  },
  {
    id: 'sc-preview',
    title: 'Tax Inclusive Toggle',
    description: 'Switch prices between tax-inclusive and tax-exclusive with ease.',
    iconName: 'Settings2',
    prefillTemplate: {
      name: 'Professional Cloud Storage API',
      price: 8800,
      description: 'Annual S3-compatible cloud bucket space with flat internal taxes included.',
      complimentary: false,
      quantity: 1,
      unit: 'Year',
      gstRate: 18,
      taxInclusive: true,
    },
  },
];

export const AVAILABLE_ICONS = [
  'Laptop',
  'Cloud',
  'ShieldAlert',
  'FileText',
  'Maximize2',
  'Percent',
  'IndianRupee',
  'Settings2',
  'Globe',
  'PenTool',
  'Cpu',
  'Database',
  'MessageSquare',
  'Sparkles',
];
