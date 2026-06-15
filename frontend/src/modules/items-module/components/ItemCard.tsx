import React from 'react';
import { ItemQuoteItem } from '../../../types';
import { formatCurrency } from '../../../itemUtils';
import QuoteIcon from './QuoteIcon';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface ItemCardProps {
  item: ItemQuoteItem;
  currencySymbol: string;
  onEdit: (item: ItemQuoteItem) => void;
  onDelete: (id: string) => void;
}

const getIconStyle = (iconName: string) => {
  const norm = iconName.toLowerCase();
  if (norm.includes('laptop') || norm.includes('computer') || norm.includes('design')) {
    return { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-600' };
  }
  if (norm.includes('cloud') || norm.includes('host') || norm.includes('domain')) {
    return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600' };
  }
  if (norm.includes('seo') || norm.includes('search') || norm.includes('line')) {
    return { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600' };
  }
  if (norm.includes('shield') || norm.includes('alert') || norm.includes('lock')) {
    return { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-600' };
  }
  return { bg: 'bg-sky-50 border-sky-100', text: 'text-sky-600' };
};

export default function ItemCard({ item, currencySymbol, onEdit, onDelete }: ItemCardProps) {
  const style = getIconStyle(item.icon || 'Laptop');

  return (
    <div
      id={`quote-item-card-${item.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${style.bg} ${style.text}`}>
          <QuoteIcon name={item.icon || 'Laptop'} size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="max-w-[170px] text-sm font-bold text-slate-900 leading-tight">{item.name}</h4>
              <p className="mt-1 max-w-[190px] break-words text-xs leading-relaxed text-slate-500">
                {item.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <span className="text-sm font-bold font-mono text-slate-900">
                {item.complimentary ? 'Free' : formatCurrency(item.price, currencySymbol)}
                {item.quantity > 1 && (
                  <span className="mt-0.5 block text-right font-sans text-[10px] font-medium text-slate-400">
                    ×{item.quantity} {item.unit || 'Nos'}
                  </span>
                )}
              </span>

              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                title="Options"
                onClick={() => onEdit(item)}
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="my-3.5 border-t border-slate-200/60" />

          <div className="flex select-none items-center gap-6 text-xs">
            <button
              id={`btn-edit-${item.id}`}
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex cursor-pointer items-center gap-1.5 py-1 font-bold text-blue-600 transition-colors hover:text-blue-700"
            >
              <Pencil size={13.5} />
              Edit
            </button>
            <button
              id={`btn-delete-${item.id}`}
              type="button"
              onClick={() => onDelete(item.id)}
              className="inline-flex cursor-pointer items-center gap-1.5 py-1 font-bold text-red-500 transition-colors hover:text-red-600"
            >
              <Trash2 size={13.5} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
