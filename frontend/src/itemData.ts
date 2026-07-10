import { ItemQuoteItem, ItemQuotationMeta } from './types';

function makeInitialItem(): ItemQuoteItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    price: 0,
    description: '',
    complimentary: false,
    quantity: 1,
    unit: 'Nos',
    discountType: 'None',
    discountValue: 0,
    gstRate: 18,
    taxInclusive: false,
    icon: 'Laptop',
  };
}

export const createInitialItems = (): ItemQuoteItem[] => [makeInitialItem()];
export const INITIAL_ITEMS: ItemQuoteItem[] = createInitialItems();
export const INITIAL_META: ItemQuotationMeta = {
  quotationNumber: '',
  clientName: '',
  clientEmail: '',
  businessName: '',
  businessEmail: '',
  date: '',
  validUntil: '',
  currency: '\u20B9',
};

export interface ShortcutCard {
  id: string;
  title: string;
  description: string;
  iconName: string;
  prefillTemplate: Partial<ItemQuoteItem>;
}

export const SHORTCUT_CARDS: ShortcutCard[] = [];

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
