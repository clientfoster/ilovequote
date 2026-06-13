import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, FileText } from 'lucide-react';
import { ItemQuoteItem, ItemQuotationMeta } from '../../types';
import ItemCard from './components/ItemCard';
import ItemModal from './components/ItemModal';
import BottomSummary from './components/BottomSummary';
import ShortcutPanel from './components/ShortcutPanel';

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

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5.5 shadow-xs">
            <h1 className="text-lg font-extrabold text-slate-800 leading-tight font-display">
              Items
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">
              Add products or services to your quote. All changes auto-calculate below.
            </p>

            <button
              type="button"
              onClick={handleAddNewItem}
              className="mt-4.5 w-full py-3.5 bg-blue-600 hover:bg-blue-700 hover:shadow-lg text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-[12.5px] shadow-sm"
            >
              <Plus size={15} />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-bold text-slate-700">No products or services yet</p>
                <p className="mt-1 text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  Click "Add Item" above to add items to your quotation list.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <React.Fragment key={item.id}>
                  <ItemCard
                    item={item}
                    currencySymbol={meta.currency}
                    onEdit={(next) => {
                      setEditingItem(next);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDeleteItem}
                  />
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-5 sticky top-20">
          <BottomSummary
            items={items}
            currencySymbol={meta.currency}
            onSaveDraft={handleSaveDraft}
            onClearAll={handleClearAll}
          />

          <ShortcutPanel onTriggerShortcut={handleShortcutTrigger} />

          {showFooterNavigation && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Step Navigation
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex h-11.5 items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold px-4 rounded-xl transition-all cursor-pointer shadow-tiny"
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
                  className="inline-flex h-11.5 items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4.5 rounded-xl shadow-md shadow-blue-100 transition-all active:scale-[0.98] cursor-pointer"
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

