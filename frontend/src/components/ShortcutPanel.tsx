import React from 'react';
import { SHORTCUT_CARDS } from '../itemData';
import QuoteIcon from './QuoteIcon';
import { ChevronRight, Sparkles } from 'lucide-react';

interface ShortcutPanelProps {
  onTriggerShortcut: (template: any) => void;
}

export default function ShortcutPanel({ onTriggerShortcut }: ShortcutPanelProps) {
  return (
    <div id="shortcuts-sidebar" className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-100 text-indigo-600">
          <Sparkles size={14} className="animate-spin-slow" />
        </div>
        <div>
          <h3 className="font-display text-xs font-bold text-slate-800 uppercase tracking-widest">
            What You Can Add
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">Click to pre-fill dynamic layers</p>
        </div>
      </div>

      <div className="space-y-3">
        {SHORTCUT_CARDS.length > 0 ? (
          SHORTCUT_CARDS.map((card) => (
            <button
              id={`btn-shortcut-card-${card.id}`}
              key={card.id}
              type="button"
              onClick={() => onTriggerShortcut(card.prefillTemplate)}
              className="w-full text-left flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-50/50 hover:translate-x-0.5 transition-all group duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <QuoteIcon name={card.iconName} size={16} />
                </div>
                <div>
                  <h4 className="font-display text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-[190px]">
                    {card.description}
                  </p>
                </div>
              </div>

              <ChevronRight
                size={14}
                className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
            No preset inventory or shortcuts are loaded.
          </div>
        )}
      </div>
    </div>
  );
}
