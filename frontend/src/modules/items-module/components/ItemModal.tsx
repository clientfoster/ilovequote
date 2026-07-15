import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  ChevronUp,
  Gift,
  Info,
  ReceiptText,
  Save,
  Tag,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ItemDiscountType, ItemQuoteItem } from '../../../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ItemQuoteItem) => void;
  editingItem: ItemQuoteItem | null;
  currencySymbol: string;
}

const units = ['Nos', 'Project', 'Hour', 'Month', 'Page', 'Days', 'Units', 'Install', 'Batch'];
const gstRates = [0, 5, 12, 18, 28];

export default function ItemModal({ isOpen, onClose, onSave, editingItem, currencySymbol }: ItemModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [complimentary, setComplimentary] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Nos');
  const [discountType, setDiscountType] = useState<ItemDiscountType>('None');
  const [discountValue, setDiscountValue] = useState(0);
  const [gstRate, setGstRate] = useState(18);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('Laptop');
  const [discountOpen, setDiscountOpen] = useState(true);
  const [taxOpen, setTaxOpen] = useState(true);
  const [customGstOpen, setCustomGstOpen] = useState(false);
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
    }
    setDiscountOpen(true);
    setTaxOpen(true);
    setCustomGstOpen(false);
    setErrors({});
    setTouched({});
  }, [editingItem, isOpen]);

  useEffect(() => {
    if (editingItem || !name) return;
    const normalizedName = name.toLowerCase();
    if (normalizedName.includes('host') || normalizedName.includes('domain') || normalizedName.includes('server')) {
      setSelectedIcon('Cloud');
    } else if (normalizedName.includes('seo') || normalizedName.includes('search') || normalizedName.includes('marketing')) {
      setSelectedIcon('Percent');
    } else if (normalizedName.includes('protect') || normalizedName.includes('security') || normalizedName.includes('ssl')) {
      setSelectedIcon('ShieldAlert');
    } else {
      setSelectedIcon('Laptop');
    }
  }, [name, editingItem]);

  const totals = useMemo(() => {
    const subtotal = Math.max(0, price) * Math.max(0, quantity);
    const rawDiscount = discountType === 'Percentage'
      ? subtotal * (Math.max(0, discountValue) / 100)
      : discountType === 'Flat'
        ? Math.max(0, discountValue)
        : 0;
    const discount = Math.min(subtotal, rawDiscount);
    const afterDiscount = subtotal - discount;
    const gst = taxInclusive
      ? afterDiscount - (afterDiscount / (1 + (Math.max(0, gstRate) / 100)))
      : afterDiscount * (Math.max(0, gstRate) / 100);
    const taxableBase = taxInclusive ? afterDiscount - gst : afterDiscount;
    const total = taxInclusive ? afterDiscount : afterDiscount + gst;
    return { subtotal, discount, afterDiscount, taxableBase, gst, total };
  }, [discountType, discountValue, gstRate, price, quantity, taxInclusive]);

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Item or service name is required.';
    if (!complimentary && (Number.isNaN(price) || price < 0)) nextErrors.price = 'Enter a valid unit price.';
    if (Number.isNaN(quantity) || quantity <= 0) nextErrors.quantity = 'Quantity must be greater than 0.';
    if (!complimentary && discountType !== 'None') {
      if (discountValue < 0) nextErrors.discountValue = 'Discount cannot be negative.';
      if (discountType === 'Percentage' && discountValue > 100) {
        nextErrors.discountValue = 'Percentage discount cannot exceed 100%.';
      }
      if (discountType === 'Flat' && discountValue > totals.subtotal) {
        nextErrors.discountValue = `Discount cannot exceed ${formatMoney(totals.subtotal)}.`;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, price: true, quantity: true, discountValue: true });
    if (!validateForm()) return;

    onSave({
      id: editingItem?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      price: complimentary ? 0 : Number(price),
      description: description.trim(),
      complimentary,
      quantity: Number(quantity),
      unit: unit.trim() || 'Nos',
      discountType: complimentary ? 'None' : discountType,
      discountValue: complimentary || discountType === 'None' ? 0 : Number(discountValue),
      gstRate: complimentary ? 0 : Number(gstRate),
      taxInclusive: complimentary ? false : taxInclusive,
      icon: selectedIcon,
    });
    onClose();
  };

  const selectDiscountType = (type: Exclude<ItemDiscountType, 'None'>) => {
    setDiscountType(type);
  };

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-slate-900"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full flex-col overflow-hidden bg-[#fcfdff] shadow-2xl sm:max-w-[560px]"
          >
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
              <button type="button" onClick={onClose} title="Go back" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <ArrowLeft size={21} />
              </button>
              <h2 className="text-[17px] font-extrabold text-slate-950">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button type="button" onClick={onClose} title="Close" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <X size={22} />
              </button>
            </header>

            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
                <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(120px,0.85fr)] items-end gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-800">Service / Item Name <span className="text-red-500">*</span></label>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      placeholder="Website Design"
                      onChange={(event) => setName(event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                      className={`${fieldClass} ${touched.name && errors.name ? 'border-red-400' : ''}`}
                    />
                  </div>
                  <label className={`flex h-[46px] cursor-pointer items-center justify-between rounded-xl border px-3 transition ${complimentary ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'}`}>
                    <span className="flex min-w-0 items-center gap-2 text-xs font-bold"><Gift size={18} className="shrink-0 text-emerald-600" /><span className="truncate">Free Item</span></span>
                    <input
                      type="checkbox"
                      checked={complimentary}
                      onChange={(event) => {
                        const free = event.target.checked;
                        setComplimentary(free);
                        if (free) {
                          setPrice(0);
                          setDiscountType('None');
                          setDiscountValue(0);
                          setGstRate(0);
                          setTaxInclusive(false);
                          setCustomGstOpen(false);
                        }
                      }}
                      className="h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
                {touched.name && errors.name && <p className="-mt-2 text-xs font-medium text-red-600">{errors.name}</p>}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-800">Description (Optional)</label>
                  <div className="relative">
                    <textarea
                      rows={4}
                      maxLength={250}
                      value={description}
                      placeholder="Responsive website design and development."
                      onChange={(event) => setDescription(event.target.value)}
                      className={`${fieldClass} resize-none pb-8 font-medium`}
                    />
                    <span className="absolute bottom-3 right-3 text-[11px] font-medium text-slate-400">{description.length}/250</span>
                  </div>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                  <div className="grid grid-cols-[0.78fr_0.9fr_1.25fr] gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-800">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value === '' ? 1 : Number(event.target.value))}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-800">Unit</label>
                      <select value={unit} onChange={(event) => setUnit(event.target.value)} className={fieldClass}>
                        {units.map((itemUnit) => <option key={itemUnit}>{itemUnit}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block truncate text-[11px] font-bold text-slate-800">Unit Price ({currencySymbol}) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={complimentary}
                        value={complimentary || price === 0 ? '' : price}
                        placeholder={complimentary ? 'Free' : '1,000.00'}
                        onChange={(event) => setPrice(event.target.value === '' ? 0 : Number(event.target.value))}
                        onBlur={() => setTouched((current) => ({ ...current, price: true }))}
                        className={`${fieldClass} ${complimentary ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''}`}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[11px] font-medium text-slate-400">Price per unit before discount &amp; tax</p>
                </section>

                {!complimentary && (
                  <>
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100">
                      <button type="button" onClick={() => setDiscountOpen((open) => !open)} className="flex w-full items-center justify-between px-4 py-4 text-left">
                        <span className="flex items-center gap-3 text-[13px] font-extrabold text-slate-900"><span className="rounded-lg bg-violet-50 p-2 text-violet-600"><Tag size={18} /></span>Discount (Optional)</span>
                        {discountOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                      </button>
                      <AnimatePresence initial={false}>
                        {discountOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="space-y-3 px-4 pb-4">
                              <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => selectDiscountType('Percentage')} className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${discountType !== 'Flat' ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500'}`}>% &nbsp; Percentage</button>
                                <button type="button" onClick={() => selectDiscountType('Flat')} className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${discountType === 'Flat' ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500'}`}>{currencySymbol} &nbsp; Fixed Amount</button>
                              </div>
                              <div>
                                <label className="mb-1.5 block text-[11px] font-bold text-slate-800">Discount Value</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max={discountType === 'Flat' ? totals.subtotal : 100}
                                    value={discountValue}
                                    onChange={(event) => {
                                      if (discountType === 'None') setDiscountType('Percentage');
                                      setDiscountValue(event.target.value === '' ? 0 : Number(event.target.value));
                                    }}
                                    className={`${fieldClass} pr-12 ${touched.discountValue && errors.discountValue ? 'border-red-400' : ''}`}
                                  />
                                  <span className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl border-l border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">{discountType === 'Flat' ? currencySymbol : '%'}</span>
                                </div>
                                <p className="mt-1.5 text-[11px] text-slate-400">Enter discount {discountType === 'Flat' ? 'amount' : 'percentage'}</p>
                                {errors.discountValue && <p className="mt-1 text-xs font-medium text-red-600">{errors.discountValue}</p>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100">
                      <button type="button" onClick={() => setTaxOpen((open) => !open)} className="flex w-full items-center justify-between px-4 py-4 text-left">
                        <span className="flex items-center gap-3 text-[13px] font-extrabold text-slate-900"><span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><ReceiptText size={18} /></span>Tax (GST)</span>
                        {taxOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                      </button>
                      <AnimatePresence initial={false}>
                        {taxOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4">
                              <div className="grid grid-cols-[0.95fr_1.15fr] items-center gap-4">
                                <div>
                                  <label className="mb-1.5 block text-[11px] font-bold text-slate-800">GST Rate</label>
                                  <select
                                    value={String(gstRate)}
                                    onChange={(event) => {
                                      if (event.target.value === '__custom') {
                                        setCustomGstOpen(true);
                                        return;
                                      }
                                      setGstRate(Number(event.target.value));
                                      setCustomGstOpen(false);
                                    }}
                                    className={fieldClass}
                                  >
                                    {gstRates.map((rate) => <option key={rate} value={rate}>{rate === 0 ? '0% (Exempt)' : `${rate}%`}</option>)}
                                    {!gstRates.includes(gstRate) && <option value={gstRate}>{gstRate}% (Custom)</option>}
                                    <option value="__custom">+ Add Custom Rate</option>
                                  </select>
                                </div>
                                <label className="mt-5 flex cursor-pointer items-start gap-2.5">
                                  <input type="checkbox" checked={taxInclusive} onChange={(event) => setTaxInclusive(event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                  <span><span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">Price includes GST <Info size={13} className="text-slate-400" /></span><span className="mt-1 block text-[10px] text-slate-400">{taxInclusive ? 'GST is included in price' : 'GST will be added on top'}</span></span>
                                </label>
                              </div>
                              <AnimatePresence initial={false}>
                                {customGstOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                                      <label className="mb-1.5 block text-[10px] font-bold text-slate-700">Custom GST Rate</label>
                                      <div className="flex items-center gap-2">
                                        <div className="relative min-w-0 flex-1">
                                          <input
                                            autoFocus
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={gstRate}
                                            onChange={(event) => {
                                              const nextRate = event.target.value === '' ? 0 : Number(event.target.value);
                                              setGstRate(Math.min(100, Math.max(0, nextRate)));
                                            }}
                                            className="w-full rounded-lg border border-blue-200 bg-white py-2.5 pl-3 pr-8 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                          />
                                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-500">%</span>
                                        </div>
                                        <button type="button" onClick={() => setCustomGstOpen(false)} className="rounded-lg bg-blue-600 px-4 py-2.5 text-[11px] font-bold text-white hover:bg-blue-700">Use Rate</button>
                                      </div>
                                      <p className="mt-1.5 text-[9px] font-medium text-slate-400">Enter any rate from 0% to 100%. Decimals are supported.</p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>

                    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                      <div className="mb-4 flex items-center gap-3"><span className="rounded-lg bg-amber-100 p-2 text-amber-600"><Calculator size={18} /></span><h3 className="text-[13px] font-extrabold text-slate-900">Price Summary <span className="font-semibold text-slate-500">(GST {taxInclusive ? 'included' : 'will be added'})</span></h3></div>
                      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-end gap-2 text-center">
                        <div><p className="text-[10px] font-medium text-slate-500">Subtotal</p><p className="mt-1 text-sm font-extrabold text-slate-900">{formatMoney(totals.taxableBase)}</p></div>
                        <span className="pb-0.5 text-sm font-bold text-slate-500">+</span>
                        <div><p className="text-[10px] font-medium text-slate-500">GST ({gstRate}%)</p><p className="mt-1 text-sm font-extrabold text-slate-900">{formatMoney(totals.gst)}</p></div>
                        <span className="pb-0.5 text-sm font-bold text-slate-500">=</span>
                        <div><p className="text-[10px] font-medium text-slate-500">You Charge</p><p className="mt-1 text-sm font-extrabold text-orange-600">{formatMoney(totals.total)}</p></div>
                      </div>
                      {totals.discount > 0 && <p className="mt-3 text-center text-[10px] font-semibold text-violet-600">Discount of {formatMoney(totals.discount)} applied</p>}
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-[11px] leading-4 text-slate-600"><Info size={16} className="mt-0.5 shrink-0 text-blue-600" /><span>GST ({gstRate}%) {taxInclusive ? 'is included in the item price.' : 'will be added to the subtotal.'}<br />Customer will pay <strong className="text-blue-600">{formatMoney(totals.total)}</strong></span></div>
                    </section>
                  </>
                )}
              </div>

              <footer className="grid shrink-0 grid-cols-[0.72fr_1.8fr] gap-3 border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"><Save size={17} />Save Item</button>
              </footer>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
