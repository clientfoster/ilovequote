import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, FileText, Trash2 } from 'lucide-react';
import { ItemQuoteItem, ItemQuotationMeta } from '../../types';
import ItemCard from './components/ItemCard';
import ItemModal from './components/ItemModal';
import BottomSummary from './components/BottomSummary';
import { calculateQuotationTotals, formatCurrency } from '../../itemUtils';
import QuoteIcon from './components/QuoteIcon';

interface ItemsWorkspaceProps {
  items: ItemQuoteItem[]; 
  meta: ItemQuotationMeta;
  onBack: () => void;
  onNext: () => void;
  onTriggerToast: (message: string) => void;
  onItemsChange: (items: ItemQuoteItem[]) => void;
  showFooterNavigation?: boolean;
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
}: ItemsWorkspaceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemQuoteItem | null>(null);

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

  const totals = calculateQuotationTotals(items);

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
                  onClick={handleAddSection}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Plus size={15} />
                  Add Section
                </button>
                <div className="inline-flex overflow-hidden rounded-xl border border-[#2563EB]">
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    <Plus size={15} />
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="inline-flex min-h-[44px] w-10 items-center justify-center border-l border-white/20 bg-[#2563EB] text-white transition-colors hover:bg-blue-700"
                    aria-label="Add item menu"
                  >
                    <ChevronRight size={14} className="rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-[minmax(0,1.6fr)_90px_130px_120px_110px_120px_42px] gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                <div className="text-center py-12 bg-white p-6">
                  <FileText className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-700">No products or services yet</p>
                  <p className="mt-1 text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                    Click "Add Item" above to add items to your quotation list.
                  </p>
                </div>
              ) : (
                items.map((item, index) => {
                  const row = getRowBreakdown(item);
                  return (
                    <div key={item.id} className="px-4 py-4 lg:py-5">
                      <div className="hidden lg:grid grid-cols-[minmax(0,1.6fr)_90px_130px_120px_110px_120px_42px] gap-3 items-center">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-indigo-50 border-indigo-100 text-indigo-600`}>
                            <QuoteIcon name={item.icon || 'Laptop'} size={22} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.name}</h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 break-words">
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

                        <div className="text-sm font-mono font-bold text-slate-900">
                          {formatCurrency(item.price, meta.currency)}
                        </div>

                        <div className="space-y-0.5">
                          {item.discountType === 'None' || row.discount === 0 ? (
                            <div className="text-xs font-mono text-slate-500">-</div>
                          ) : (
                            <>
                              <div className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                {item.discountType === 'Percentage' ? `${item.discountValue}%` : formatCurrency(item.discountValue, meta.currency)}
                              </div>
                              <div className="text-xs font-mono text-emerald-600">- {formatCurrency(row.discount, meta.currency)}</div>
                            </>
                          )}
                        </div>

                        <div>
                          <div className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                            {item.gstRate}% GST
                          </div>
                        </div>

                        <div className="text-sm font-mono font-bold text-slate-900">
                          {formatCurrency(row.amount, meta.currency)}
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="lg:hidden">
                        <ItemCard
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
          </div>

          <div className="md:hidden">
            <BottomSummary
              items={items}
              currencySymbol={meta.currency}
              onSaveDraft={handleSaveDraft}
              onClearAll={handleClearAll}
            />
          </div>
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

