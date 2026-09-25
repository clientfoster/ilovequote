import React, { useState } from 'react';
import ManualQuoteGenerator from '../components/quote-generator/ManualQuoteGenerator';
import QuoteWizard from '../wizard/QuoteWizard';
import { Sparkles, Layers } from 'lucide-react';

export default function CreateQuotePage() {
  const [viewMode, setViewMode] = useState<'instant' | 'wizard'>('instant');

  return (
    <div>
      {/* Switcher Banner to let users toggle between New Instant Model & 4-Step Wizard */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-xs py-2 px-4 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide">
              New Model
            </span>
            <span className="font-medium text-slate-200">
              {viewMode === 'instant' ? 'Instant Price Quote Generator (Manual, Photo & Audio)' : 'Classic 4-Step Quotation Wizard'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'instant' ? 'wizard' : 'instant')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            {viewMode === 'instant' ? (
              <>
                <Layers className="w-3.5 h-3.5 text-blue-300" />
                Switch to 4-Step Wizard
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Switch to New Instant Quote
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'instant' ? <ManualQuoteGenerator /> : <QuoteWizard />}
    </div>
  );
}
