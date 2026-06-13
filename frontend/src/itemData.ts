import { ItemQuoteItem, ItemQuotationMeta } from './types';

export const INITIAL_ITEMS: ItemQuoteItem[] = [
  {
    id: 'item-1',
    name: 'Website Design & Development',
    price: 25000,
    description: 'Responsive website design and development',
    complimentary: false,
    quantity: 1,
    unit: 'Nos',
    discountType: 'Percentage',
    discountValue: 10,
    gstRate: 18,
    taxInclusive: false,
    icon: 'Laptop',
  },
  {
    id: 'item-2',
    name: 'Domain & Hosting',
    price: 2500,
    description: '1 Year domain and hosting',
    complimentary: false,
    quantity: 1,
    unit: 'Nos',
    discountType: 'None',
    discountValue: 0,
    gstRate: 18,
    taxInclusive: false,
    icon: 'Cloud',
  },
  {
    id: 'item-3',
    name: 'SEO Setup',
    price: 8000,
    description: 'Basic on-page SEO setup',
    complimentary: false,
    quantity: 1,
    unit: 'Nos',
    discountType: 'Percentage',
    discountValue: 5,
    gstRate: 18,
    taxInclusive: false,
    icon: 'Percent',
  },
];

export const INITIAL_META: ItemQuotationMeta = {
  quotationNumber: 'Q-2024-001',
  clientName: 'Swanish Healthcare Pvt. Ltd.',
  clientEmail: 'info@swanishhealthcare.com',
  businessName: 'Semixon Technologies',
  businessEmail: 'hello@semixon.com',
  date: '2024-05-16',
  validUntil: '2024-05-30',
  currency: 'â‚¹',
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
