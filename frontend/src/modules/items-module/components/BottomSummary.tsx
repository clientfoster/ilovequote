import React from 'react';
import { ItemQuoteItem } from '../../../types';
import { calculateQuotationTotals, formatCurrency } from '../../../itemUtils';
import { ShieldCheck, Receipt } from 'lucide-react';

interface BottomSummaryProps {
  items: ItemQuoteItem[];
  currencySymbol: string;
  onSaveDraft: () => void;
  onClearAll: () => void;
}

export default function BottomSummary({ items, currencySymbol, onSaveDraft, onClearAll }: BottomSummaryProps) {
  const { subtotal, discountTotal, gstTotal, grandTotal } = calculateQuotationTotals(items);

  return (
    <div
      id="bottom-summary-card"
      className="bg-white rounded-2xl p-5 text-slate-900 shrink-0 shadow-sm border border-slate-200 space-y-4"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Receipt className="text-[#2563EB]" size={18} />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Quote Summary
        </h3>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-600">
          <span className="font-medium">Sub Total</span>
          <span className="font-bold font-mono">{formatCurrency(subtotal, currencySymbol)}</span>
        </div>

        {discountTotal > 0 ? (
          <div className="flex justify-between items-center text-emerald-600 font-bold">
            <span className="font-medium">Discount</span>
            <span className="font-mono">-{formatCurrency(discountTotal, currencySymbol)}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-slate-500">
            <span className="font-medium">Discount</span>
            <span className="font-mono">-</span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-600">
          <span className="font-medium">Tax (18% GST)</span>
          <span className="font-bold font-mono">+{formatCurrency(gstTotal, currencySymbol)}</span>
        </div>

        <div className="border-t border-slate-100 my-2 pt-2.5" />

        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-900">Total</span>
          <span className="text-xl font-bold text-[#2563EB] font-mono">
            {formatCurrency(grandTotal, currencySymbol)}
          </span>
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-2">
        <button
          id="btn-save-draft"
          type="button"
          onClick={onSaveDraft}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <ShieldCheck size={14} />
          Save Draft
        </button>

        <button
          id="btn-clear-all"
          type="button"
          onClick={onClearAll}
          className="w-full min-h-[44px] py-2 px-4 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 bg-transparent border border-slate-200 transition-colors"
        >
          Clear All Items
        </button>
      </div>

      <div className="text-[10px] text-slate-400 text-center leading-relaxed">
        Tax calculations are updated automatically.
      </div>
    </div>
  );
}

