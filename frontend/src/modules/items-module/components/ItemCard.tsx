import React from 'react';
import { ItemQuoteItem } from '../../../types';
import { formatCurrency } from '../../../itemUtils';
import QuoteIcon from './QuoteIcon';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface ItemCardProps {
  index: number;
  item: ItemQuoteItem;
  currencySymbol: string;
  onEdit: (item: ItemQuoteItem) => void;
  onDelete: (id: string) => void;
}

export default function ItemCard({ index, item, currencySymbol, onEdit, onDelete }: ItemCardProps) {
  return (
    <div
      id={`quote-item-card-${item.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-slate-50 border-slate-200 text-slate-800 text-xl font-bold">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="max-w-[170px] text-sm font-bold text-slate-900 leading-tight">{item.name}</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed break-words max-w-[190px]">
                {item.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm font-bold text-slate-900 font-mono">
                {item.complimentary ? 'Free' : formatCurrency(item.price, currencySymbol)}
                {item.quantity > 1 && (
                  <span className="text-[10px] text-slate-400 font-sans font-medium block text-right mt-0.5">
                    ×{item.quantity} {item.unit || 'Nos'}
                  </span>
                )}
              </span>

              <button
                type="button"
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-650 transition-colors"
                title="Options"
                onClick={() => onEdit(item)}
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200/60 my-3.5" />

          <div className="flex items-center gap-6 text-xs select-none">
            <button
              id={`btn-edit-${item.id}`}
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer py-1"
            >
              <Pencil size={13.5} />
              Edit
            </button>
            <button
              id={`btn-delete-${item.id}`}
              type="button"
              onClick={() => onDelete(item.id)}
              className="inline-flex items-center gap-1.5 font-bold text-red-500 hover:text-red-650 transition-colors cursor-pointer py-1"
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

