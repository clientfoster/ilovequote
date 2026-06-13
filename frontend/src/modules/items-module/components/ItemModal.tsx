import React, { useEffect, useState } from 'react';
import { X, ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AVAILABLE_ICONS } from '../../../itemData';
import { ItemQuoteItem, ItemDiscountType } from '../../../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ItemQuoteItem) => void;
  editingItem: ItemQuoteItem | null;
  currencySymbol: string;
}

export default function ItemModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  currencySymbol,
}: ItemModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [complimentary, setComplimentary] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('Nos');
  const [discountType, setDiscountType] = useState<ItemDiscountType>('None');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(18);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('Laptop');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setPrice(editingItem.price);
      setDescription(editingItem.description);
      setComplimentary(editingItem.complimentary);
      setQuantity(editingItem.quantity);
      setUnit(editingItem.unit || 'Nos');
      setDiscountType(editingItem.discountType || 'None');
      setDiscountValue(editingItem.discountValue || 0);
      setGstRate(editingItem.gstRate ?? 18);
      setTaxInclusive(editingItem.taxInclusive ?? false);
      setSelectedIcon(editingItem.icon || 'Laptop');
      setIsAdvancedOpen(true);
    } else {
      setName('');
      setPrice(0);
      setDescription('');
      setComplimentary(false);
      setQuantity(1);
      setUnit('Nos');
      setDiscountType('None');
      setDiscountValue(0);
      setGstRate(18);
      setTaxInclusive(false);
      setSelectedIcon('Laptop');
      setIsAdvancedOpen(false);
    }
    setErrors({});
    setTouched({});
  }, [editingItem, isOpen]);

  useEffect(() => {
    if (!editingItem && name) {
      const norm = name.toLowerCase();
      if (norm.includes('host') || norm.includes('domain') || norm.includes('server')) {
        setSelectedIcon('Cloud');
      } else if (norm.includes('seo') || norm.includes('search') || norm.includes('marketing')) {
        setSelectedIcon('Percent');
      } else if (norm.includes('protect') || norm.includes('security') || norm.includes('ssl')) {
        setSelectedIcon('ShieldAlert');
      } else {
        setSelectedIcon('Laptop');
      }
    }
  }, [name, editingItem]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Item or service name is required.';
    }

    if (!complimentary) {
      if (price === undefined || price === null || Number.isNaN(price)) {
        newErrors.price = 'Valid price is required.';
      } else if (price < 0) {
        newErrors.price = 'Price cannot be negative.';
      }
    }

    if (quantity === undefined || quantity === null || Number.isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0.';
    }

    if (discountType !== 'None') {
      const lineTotalBeforeDiscount = (complimentary ? 0 : price) * quantity;
      if (discountValue < 0) {
        newErrors.discountValue = 'Discount cannot be negative.';
      } else if (discountType === 'Percentage' && discountValue > 100) {
        newErrors.discountValue = 'Percentage discount cannot exceed 100%.';
      } else if (discountType === 'Flat' && discountValue > lineTotalBeforeDiscount) {
        newErrors.discountValue = `Discount cannot exceed subtotal (${currencySymbol}${lineTotalBeforeDiscount}).`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, price: true, quantity: true, discountValue: true });
    if (!validateForm()) return;

    const savedItem: ItemQuoteItem = {
      id: editingItem?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      price: complimentary ? 0 : Number(price),
      description: description.trim(),
      complimentary,
      quantity: Number(quantity),
      unit: unit.trim() || 'Nos',
      discountType,
      discountValue: discountType === 'None' ? 0 : Number(discountValue),
      gstRate: Number(gstRate),
      taxInclusive,
      icon: selectedIcon,
    };

    onSave(savedItem);
    onClose();
  };

  const prefillUnits = ['Nos', 'Project', 'Hour', 'Month', 'Page', 'Days', 'Units', 'Install', 'Batch'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:max-w-[460px] bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>

              <h2 className="text-base font-bold text-slate-800 text-center flex-1">
                {editingItem ? 'Edit Item' : 'Add Item'}
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                title="Close Drawer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Service / Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Design"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) validateForm();
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  className={`w-full px-4 py-3 rounded-xl border text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    touched.name && errors.name
                      ? 'border-red-300 text-red-900'
                      : 'border-slate-200 text-slate-800 focus:border-blue-600'
                  }`}
                />
                {touched.name && errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Price ({currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  disabled={complimentary}
                  placeholder={complimentary ? '0' : 'e.g. 25000'}
                  value={complimentary ? '' : price === 0 ? '' : price}
                  onChange={(e) => {
                    setPrice(e.target.value === '' ? 0 : Number(e.target.value));
                    if (touched.price) validateForm();
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, price: true }))}
                  className={`w-full px-4 py-3 rounded-xl border text-[13px] font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    complimentary
                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed italic'
                      : touched.price && errors.price
                        ? 'border-red-300 text-red-900'
                        : 'border-slate-200 text-slate-800 focus:border-blue-600'
                  }`}
                />
                {touched.price && errors.price && !complimentary && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Responsive website design and development"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-start gap-3 p-4 border border-slate-100 bg-slate-50/50 rounded-xl">
                <input
                  type="checkbox"
                  checked={complimentary}
                  onChange={(e) => {
                    setComplimentary(e.target.checked);
                    if (e.target.checked) setPrice(0);
                  }}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                />
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                    Complimentary (Free)
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Mark this item as free
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full h-15 flex items-center justify-between px-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800">Advanced Options</span>
                    <span className="text-[10.5px] text-slate-400 font-medium mt-0.5 truncate">
                      Add quantity, discount, tax and more
                    </span>
                  </div>
                  <div className="p-1 text-slate-400">
                    {isAdvancedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isAdvancedOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-150 p-4 bg-slate-50/30 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={quantity === 0 ? '' : quantity}
                            onChange={(e) => setQuantity(e.target.value === '' ? 1 : Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold font-mono text-slate-800 focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Unit
                          </label>
                          <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:border-blue-600 focus:outline-none"
                          >
                            {prefillUnits.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                            Discount (Optional)
                          </span>
                          <HelpCircle size={12} className="text-slate-400" />
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1 mb-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountType('Percentage');
                              if (discountValue === 0) setDiscountValue(10);
                            }}
                            className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                              discountType === 'Percentage'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountType('Flat');
                              if (discountValue === 0) setDiscountValue(500);
                            }}
                            className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                              discountType === 'Flat'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {currencySymbol}
                          </button>
                        </div>

                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={discountType === 'None' ? 0 : discountValue}
                          onChange={(e) => setDiscountValue(e.target.value === '' ? 0 : Number(e.target.value))}
                          className={`w-full px-3 py-2.5 rounded-lg border text-xs font-bold focus:outline-none ${
                            touched.discountValue && errors.discountValue
                              ? 'border-red-300 text-red-900'
                              : 'border-slate-200 text-slate-800 focus:border-blue-600'
                          }`}
                        />
                        {touched.discountValue && errors.discountValue && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{errors.discountValue}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            GST %
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={gstRate}
                            onChange={(e) => setGstRate(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <label className="flex items-center gap-2 mt-5 text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={taxInclusive}
                            onChange={(e) => setTaxInclusive(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          Tax Inclusive
                        </label>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Icon
                        </label>
                        <select
                          value={selectedIcon}
                          onChange={(e) => setSelectedIcon(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                        >
                          {AVAILABLE_ICONS.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  Save Item
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

