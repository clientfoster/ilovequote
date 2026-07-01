import React, { useState } from 'react';
import { ItemQuoteItem } from '../../../types';
import { formatCurrency } from '../../../itemUtils';
import QuoteIcon from './QuoteIcon';
import { Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface ItemCardProps {
  index: number;
  item: ItemQuoteItem;
  currencySymbol: string;
  onEdit: (item: ItemQuoteItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: ItemQuoteItem) => void;
}

export default function ItemCard({ item, currencySymbol, onEdit, onDelete, onDuplicate }: ItemCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      id={`quote-item-card-${item.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <QuoteIcon name={item.icon || 'Package'} size={20} className="stroke-[1.9]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="max-w-[150px] text-sm font-bold leading-tight text-slate-900">{item.name}</h4>
              <p className="mt-1 max-w-[165px] break-words text-xs leading-relaxed text-slate-500">
                {item.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-start gap-2 shrink-0">
              <span className="whitespace-nowrap text-right text-sm font-bold text-slate-900 font-mono">
                {item.complimentary ? 'Free' : formatCurrency(item.price, currencySymbol)}
              </span>

              <div className="relative">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  title="Options"
                  aria-label={`More actions for ${item.name}`}
                  onClick={() => setIsMenuOpen((open) => !open)}
                >
                  <MoreVertical size={16} />
                </button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(item);
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="mr-2 h-4 w-4 text-slate-400" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDuplicate(item);
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Copy className="mr-2 h-4 w-4 text-slate-400" />
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(item.id);
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-red-400" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="my-3.5 border-t border-slate-200/60" />

          <div className="flex items-center justify-center gap-12 text-xs select-none">
            <button
              id={`btn-edit-${item.id}`}
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 py-1 font-bold text-blue-600 transition-colors hover:text-blue-700"
            >
              <Pencil size={13.5} />
              Edit
            </button>
            <button
              id={`btn-delete-${item.id}`}
              type="button"
              onClick={() => onDelete(item.id)}
              className="inline-flex items-center gap-1.5 py-1 font-bold text-red-500 transition-colors hover:text-red-600"
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
