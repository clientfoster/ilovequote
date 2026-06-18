import React, { useState } from 'react';
import { Calendar, Building, User, Settings, Sparkles, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { ItemQuoteItem, ItemQuotationMeta } from '../types';
import { calculateQuotationTotals, formatCurrency } from '../itemUtils';
import QuoteIcon from './QuoteIcon';

interface QuotationPreviewProps {
  items: ItemQuoteItem[];
  meta: ItemQuotationMeta;
  onUpdateMeta: (meta: ItemQuotationMeta) => void;
}

export default function QuotationPreview({ items, meta, onUpdateMeta }: QuotationPreviewProps) {
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const { subtotal, discountTotal, gstTotal, grandTotal } = calculateQuotationTotals(items);

  const handleInputChange = (field: keyof ItemQuotationMeta, value: string) => {
    onUpdateMeta({
      ...meta,
      [field]: value,
    });
  };

  return (
    <div id="quotation-preview-container" className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsEditingMeta(!isEditingMeta)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quotation Header Settings
            </span>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              Interactive
            </span>
          </div>
          {isEditingMeta ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {isEditingMeta && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/30">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Your Business Name
              </label>
              <input
                type="text"
                value={meta.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={meta.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Quotation Number
              </label>
              <input
                type="text"
                value={meta.quotationNumber}
                onChange={(e) => handleInputChange('quotationNumber', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <select
                value={meta.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none bg-white"
              >
                <option value="₹">Rupee (₹)</option>
                <option value="$">US Dollar ($)</option>
                <option value="€">Euro (€)</option>
                <option value="£">Pound (£)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-md shadow-slate-100/30 overflow-hidden min-h-[300px]">
        <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-900 p-6 text-white overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-15 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-white">
              <polygon points="50,0 100,0 100,100 0,100" />
            </svg>
          </div>

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-100">
                <Sparkles size={10} className="text-amber-300 fill-amber-300" /> Digital Quotation
              </span>
              <h2 className="mt-2.5 text-base font-extrabold tracking-tight text-white leading-tight">
                {meta.businessName || 'iLoveQuote Solutions'}
              </h2>
              <p className="text-[11px] text-indigo-100 mt-1">
                Contact: {meta.businessEmail}
              </p>
            </div>

            <div className="text-left sm:text-right border-t border-white/10 pt-3 sm:border-0 sm:pt-0">
              <span className="text-[9px] text-indigo-200 uppercase tracking-widest font-bold">Proposal No</span>
              <p className="text-sm font-mono font-bold mt-0.5 leading-none">
                {meta.quotationNumber || 'QT-2026-612'}
              </p>
              <div className="mt-2 flex flex-col sm:items-end text-[10px] text-indigo-100/80 space-y-0.5">
                <span>Date: {meta.date}</span>
                <span>Valid: {meta.validUntil}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-slate-700">
          <div className="flex items-center gap-2">
            <User size={13} className="text-slate-400" />
            <div className="text-xs">
              <span className="text-slate-400 font-bold mb-0.5 block uppercase tracking-wider text-[9px]">Prepared For</span>
              <span className="font-bold text-slate-800">{meta.clientName || 'Valued Customer'}</span>
            </div>
          </div>
          {meta.clientEmail && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
                {meta.clientEmail}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">
            Line Items Added ({items.length})
          </h3>

          {items.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-600">No quotation items yet</p>
              <p className="mt-1 text-xs text-slate-400 max-w-[245px] mx-auto leading-relaxed">
                Add services or select standard presets to preview totals instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {items.map((item, index) => {
                const base = item.complimentary ? 0 : item.price;
                const totalItemBase = base * item.quantity;
                let calculatedItemDiscount = 0;
                if (!item.complimentary && item.discountType !== 'None' && item.discountValue > 0) {
                  calculatedItemDiscount = item.discountType === 'Percentage'
                    ? totalItemBase * (item.discountValue / 100)
                    : item.discountValue;
                }
                const subAfterDiscount = totalItemBase - calculatedItemDiscount;

                let itemGstVal = 0;
                let finalPreviewTotal = 0;

                if (item.taxInclusive) {
                  const factor = 1 + (item.gstRate / 100);
                  const preTax = subAfterDiscount / factor;
                  itemGstVal = subAfterDiscount - preTax;
                  finalPreviewTotal = subAfterDiscount;
                } else {
                  itemGstVal = subAfterDiscount * (item.gstRate / 100);
                  finalPreviewTotal = subAfterDiscount + itemGstVal;
                }

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-100 text-xs">
                    <div className="flex-1 min-w-0 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-300 font-mono">{index + 1}.</span>
                        <h4 className="font-bold text-slate-800 truncate text-xs">{item.name}</h4>
                        <div className="ml-1 text-slate-400">
                          <QuoteIcon name={item.icon || 'Laptop'} size={14} />
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 truncate max-w-[280px]">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded">
                          {item.quantity} {item.unit || 'Unit'}(s) × {item.complimentary ? 'Free' : formatCurrency(item.price, meta.currency)}
                        </span>
                        {calculatedItemDiscount > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded font-mono">
                            Discount -{item.discountType === 'Percentage' ? `${item.discountValue}%` : formatCurrency(item.discountValue, meta.currency)}
                          </span>
                        )}
                        {item.gstRate > 0 && (
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 font-mono rounded">
                            {item.gstRate}% GST ({item.taxInclusive ? 'Incl.' : 'Excl.'})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono font-bold text-slate-800 text-xs shrink-0 pl-1">
                      {item.complimentary ? (
                        <span className="text-[11px] font-bold text-emerald-600">Free</span>
                      ) : (
                        <span>{formatCurrency(finalPreviewTotal, meta.currency)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            <div className="pt-4 mt-6 border-t border-slate-250 max-w-sm ml-auto space-y-1.5 text-right">
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal, meta.currency)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between items-center text-[11px] text-emerald-600 font-bold">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-{formatCurrency(discountTotal, meta.currency)}</span>
                </div>
              )}

              {gstTotal > 0 && (
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium font-mono">
                  <span>GST Total:</span>
                  <span className="font-mono">+{formatCurrency(gstTotal, meta.currency)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span className="uppercase tracking-wide text-slate-600">Grand Total:</span>
                <span className="font-mono text-sm text-indigo-650 font-black">
                  {formatCurrency(grandTotal, meta.currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Thank you for your business. Generates real-time values via iLoveQuote.
          </p>
        </div>
      </div>
    </div>
  );
}
