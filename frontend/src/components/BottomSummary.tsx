import React from 'react';
import { ItemQuoteItem } from '../types';
import { calculateQuotationTotals, formatCurrency } from '../itemUtils';
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
      className="bg-slate-900 rounded-2xl p-6 text-white shrink-0 shadow-xl border border-slate-850 space-y-5"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Receipt className="text-indigo-400" size={18} />
        <h3 className="font-display text-xs font-bold text-slate-300 uppercase tracking-widest">
          Quotation Totals
        </h3>
      </div>

      <div className="space-y-2.5 font-mono text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span className="font-sans font-medium text-slate-400">Subtotal</span>
          <span className="font-bold">{formatCurrency(subtotal, currencySymbol)}</span>
        </div>

        {discountTotal > 0 ? (
          <div className="flex justify-between items-center text-emerald-400 font-bold">
            <span className="font-sans font-medium text-emerald-400">Applied Discount</span>
            <span>-{formatCurrency(discountTotal, currencySymbol)}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-slate-500">
            <span className="font-sans font-medium text-slate-500">Applied Discount</span>
            <span>-</span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-400">
          <span className="font-sans font-medium text-slate-400">GST (Service Tax)</span>
          <span className="font-bold">+{formatCurrency(gstTotal, currencySymbol)}</span>
        </div>

        <div className="border-t border-slate-800 my-2 pt-2.5" />

        <div className="flex justify-between items-center">
          <span className="font-sans text-xs font-semibold text-slate-300">Total Amount Payable</span>
          <span className="text-xl font-bold font-display text-indigo-400">
            {formatCurrency(grandTotal, currencySymbol)}
          </span>
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-2">
        <button
          id="btn-save-draft"
          type="button"
          onClick={onSaveDraft}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-900/30 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <ShieldCheck size={14} />
          Save Draft
        </button>

        <button
          id="btn-clear-all"
          type="button"
          onClick={onClearAll}
          className="w-full py-2 px-4 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800/45 bg-transparent border border-slate-800 transition-colors"
        >
          Clear All Items
        </button>
      </div>

      <div className="text-[10px] text-slate-500 text-center leading-relaxed">
        Tax-inclusive calculations dynamically handled list-wide.
      </div>
    </div>
  );
}
