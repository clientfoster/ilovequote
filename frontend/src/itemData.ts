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
