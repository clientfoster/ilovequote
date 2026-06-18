import React, { useState } from 'react';

import { ChevronLeft, ChevronRight, ChevronDown, Plus, FileText, Trash2, MoreVertical, Copy, Pencil } from 'lucide-react';
import { ItemQuoteItem, ItemQuotationMeta } from '../../types';
import ItemCard from './components/ItemCard';
import ItemModal from './components/ItemModal';
import BottomSummary from './components/BottomSummary';
import { calculateQuotationTotals, formatCurrency } from '../../itemUtils';
import QuoteIcon from './components/QuoteIcon';
import TermsAndConditions, { TermItem } from './components/TermsAndConditions';
import { Fragment } from 'react';

interface ItemsWorkspaceProps {
  items: ItemQuoteItem[]; 
  meta: ItemQuotationMeta;
  onBack: () => void;
  onNext: () => void;
  onTriggerToast: (message: string) => void;
  onItemsChange: (items: ItemQuoteItem[]) => void;
  showFooterNavigation?: boolean;
  terms: TermItem[];
  onTermsChange: (terms: TermItem[]) => void;
}

const makePrefilledItem = (template: Partial<ItemQuoteItem>): ItemQuoteItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: template.name || 'New Item',
  price: template.price ?? 0,
  description: template.description || '',
  complimentary: template.complimentary ?? false,
  quantity: template.quantity ?? 1,
  unit: template.unit || 'Nos',
  discountType: template.discountType || 'None',
  discountValue: template.discountValue ?? 0,
  gstRate: template.gstRate ?? 18,
  taxInclusive: template.taxInclusive ?? false,
  icon: template.icon || 'Laptop',
});

export default function ItemsWorkspace({
  items,
  meta,
  onBack,
  onNext,
  onTriggerToast,
  onItemsChange,
  showFooterNavigation = true,
  terms,
  onTermsChange,
}: ItemsWorkspaceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemQuoteItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const persistItems = (nextItems: ItemQuoteItem[]) => {
    onItemsChange(nextItems);
  };

  const handleSaveItem = (savedItem: ItemQuoteItem) => {
    const exists = items.some((item) => item.id === savedItem.id);
    const nextItems = exists
      ? items.map((item) => (item.id === savedItem.id ? savedItem : item))
      : [...items, savedItem];

    persistItems(nextItems);
    onTriggerToast(exists ? `Updated "${savedItem.name}" successfully!` : `Added "${savedItem.name}" to your quotation list.`);
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find((item) => item.id === id);
    persistItems(items.filter((item) => item.id !== id));
    if (itemToDelete) {
      onTriggerToast(`Removed "${itemToDelete.name}" from quotation.`);
    }
  };

  const handleDuplicateItem = (item: ItemQuoteItem) => {
    const duplicatedItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${item.name} (Copy)`,
    };
    const nextItems = [...items, duplicatedItem];
    persistItems(nextItems);
    onTriggerToast(`Duplicated "${item.name}" successfully!`);
  };

  const handleSaveDraft = () => {
    onTriggerToast('Quotation draft saved to browser storage.');
  };

  const handleClearAll = () => {
    persistItems([]);
    onTriggerToast('All quotation items cleared.');
  };

  const handleShortcutTrigger = (template: Partial<ItemQuoteItem>) => {
    setEditingItem(makePrefilledItem(template));
    setIsModalOpen(true);
  };

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleAddSection = () => {
    onTriggerToast('Sections are managed automatically in this demo workspace.');
  };

  const getRowBreakdown = (item: ItemQuoteItem) => {
    const base = item.complimentary ? 0 : item.price;
    const qty = Math.max(0, item.quantity);
    const subtotal = base * qty;
    const discount = item.discountType === 'Percentage'
      ? subtotal * (Math.max(0, item.discountValue) / 100)
      : item.discountType === 'Flat'
        ? Math.max(0, item.discountValue)
        : 0;
    const safeDiscount = Math.min(subtotal, discount);
    const afterDiscount = subtotal - safeDiscount;
    const gst = item.taxInclusive
      ? afterDiscount - (afterDiscount / (1 + (item.gstRate / 100)))
      : afterDiscount * (item.gstRate / 100);
    const amount = item.taxInclusive ? afterDiscount : afterDiscount + gst;

    return {
      subtotal,
      discount: safeDiscount,
      gst,
      amount,
    };
  };

  return (
    <div className="w-full space-y-5 md:space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 md:gap-6 items-start">
        <div className="space-y-4 md:space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Items
                </h1>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Add products or services to your quote.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  <Plus size={15} />
                  Add Item
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-[minmax(220px,1.2fr)_74px_116px_112px_110px_120px_42px] gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <div>Item / Description</div>
              <div className="text-center">Qty</div>
              <div>Unit Price</div>
              <div>Discount</div>
              <div>Tax</div>
              <div>Amount</div>
              <div />
            </div>

            <div className="divide-y divide-slate-200">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-white min-h-[400px]">
                  <div className="relative mb-6 flex justify-center w-full">
                    <div className="relative w-36 h-28 bg-slate-50 border border-slate-100 rounded-xl flex flex-col p-3 shadow-xs">
                       <div className="flex gap-2 mb-2">
                         <div className="w-6 h-6 rounded bg-blue-100/50 flex items-center justify-center"><div className="w-3 h-3 bg-blue-300 rounded-sm"></div></div>
                         <div className="flex-1 space-y-1.5 py-1">
                           <div className="h-2 w-12 bg-slate-200 rounded-full"></div>
                           <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                         </div>
                       </div>
                       <div className="space-y-1.5 pt-2 border-t border-slate-100">
                         <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                         <div className="h-1.5 w-3/4 bg-slate-100 rounded-full"></div>
                       </div>
                       <div className="absolute -right-3 -top-3 w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">₹</div>
                       <div className="absolute -left-2 top-4 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                       <div className="absolute -right-1 bottom-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">No items added yet</h3>
                  <p className="mt-1.5 text-[13px] text-slate-500 max-w-[280px] mx-auto leading-relaxed font-medium">
                    Start adding the products or services you want to include in this quote.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="mt-6 inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    <Plus size={14} />
                    Add Your First Item
                  </button>
                  <button type="button" className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                    Learn how to add items <ChevronDown className="inline w-3 h-3 ml-0.5" />
                  </button>
                </div>
              ) : (
                items.map((item, index) => {
                  const row = getRowBreakdown(item);
                  return (
                    <div key={item.id} className="px-4 py-4 lg:py-6">
                      <div className="hidden lg:grid grid-cols-[minmax(220px,1.2fr)_74px_116px_112px_110px_120px_42px] gap-3 items-center min-h-[96px]">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-slate-50 border-slate-200 text-slate-800 text-xl font-bold">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="max-w-[165px] text-sm font-bold text-slate-900 leading-tight">{item.name}</h4>
                            <p className="mt-1 max-w-[175px] text-xs leading-relaxed text-slate-500 break-words">
                              {item.description || 'No description provided.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800">
                            {item.quantity}
                          </div>
                          <span className="ml-2 text-xs text-slate-500">{item.unit || 'Nos'}</span>
                        </div>

                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(item.price, meta.currency)}
                        </div>

                        <div className="space-y-0.5">
                          {item.discountType === 'None' || row.discount === 0 ? (
                            <div className="text-xs font-mono text-slate-400">-</div>
                          ) : (
                            <>
                              <div className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                {item.discountType === 'Percentage' ? `${item.discountValue}%` : formatCurrency(item.discountValue, meta.currency)}
                              </div>
                              <div className="text-xs font-mono text-emerald-600">- {formatCurrency(row.discount, meta.currency)}</div>
                            </>
                          )}
                        </div>

                        <div>
                          <div className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800">
                            {item.gstRate}% GST
                            <ChevronDown size={14} className="text-slate-400" />
                          </div>
                        </div>

                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(row.amount, meta.currency)}
                        </div>

                        <div className="flex justify-end">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>
                            
                            {activeMenuId === item.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActiveMenuId(null)}
                                />
                                <div className="absolute right-0 z-20 mt-1 w-36 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItem(item);
                                        setIsModalOpen(true);
                                        setActiveMenuId(null);
                                      }}
                                      className="text-slate-700 hover:bg-slate-50 hover:text-slate-900 group flex w-full items-center px-3 py-2 text-sm font-medium"
                                    >
                                      <Pencil className="mr-2 h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDuplicateItem(item);
                                        setActiveMenuId(null);
                                      }}
                                      className="text-slate-700 hover:bg-slate-50 hover:text-slate-900 group flex w-full items-center px-3 py-2 text-sm font-medium"
                                    >
                                      <Copy className="mr-2 h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                                      Duplicate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteItem(item.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="text-red-600 hover:bg-red-50 hover:text-red-700 group flex w-full items-center px-3 py-2 text-sm font-medium"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4 text-red-400 group-hover:text-red-500" />
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="lg:hidden">
                        <ItemCard
                          index={index}
                          item={item}
                          currencySymbol={meta.currency}
                          onEdit={(next) => {
                            setEditingItem(next);
                            setIsModalOpen(true);
                          }}
                          onDelete={handleDeleteItem}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-slate-200 p-4 md:p-5">
                <div className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-[#2563EB]"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
              </div>
            )}
            {items.length === 0 && (
              <div className="bg-indigo-50/80 border-t border-indigo-100 p-3 px-4 flex items-center gap-3">
                <div className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold font-serif text-[11px] italic">i</div>
                <p className="text-xs font-bold text-indigo-900">Add items and set prices to build your quote.</p>
              </div>
            )}
          </div>

          <TermsAndConditions terms={terms} onChange={onTermsChange} />

          <div className="md:hidden">
            <BottomSummary
              items={items}
              currencySymbol={meta.currency}
              onSaveDraft={handleSaveDraft}
              onClearAll={handleClearAll}
            />
          </div>

          {showFooterNavigation && (
            <div className="pt-6 border-t border-slate-200 hidden md:flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (items.length === 0) {
                    onTriggerToast('Add at least one line item before previewing.');
                    return;
                  }
                  onNext();
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
              >
                Next: Preview
                <ChevronRight size={16} />
              </button>
            </div>
          )}
      </div>

        <div className="hidden xl:block space-y-4 md:space-y-5 sticky top-20">
          <BottomSummary
            items={items}
            currencySymbol={meta.currency}
            onSaveDraft={handleSaveDraft}
            onClearAll={handleClearAll}
          />

          {showFooterNavigation && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Step Navigation
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex min-h-[44px] h-11.5 items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold px-4 rounded-xl transition-all cursor-pointer shadow-tiny"
                >
                  <ChevronLeft size={15} />
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (items.length === 0) {
                      onTriggerToast('Add at least one line item before previewing.');
                      return;
                    }
                    onNext();
                  }}
                  className="inline-flex min-h-[44px] h-11.5 items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4.5 rounded-xl shadow-md shadow-blue-100 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Next Preview</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
        currencySymbol={meta.currency}
      />
    </div>
  );
}

