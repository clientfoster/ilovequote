import React from 'react';
import { ChevronRight, Building2, ImageIcon, MapPin, Coins, Eye } from 'lucide-react';

interface ShortcutCard {
  label: string;
  targetId: string;
  icon: React.ElementType;
}

export default function ShortcutCards() {
  const cards: ShortcutCard[] = [
    { label: 'Client / Company Details', targetId: 'section-client-details', icon: Building2 },
    { label: 'Upload Client Logo', targetId: 'section-client-logo', icon: ImageIcon },
    { label: 'Billing Address', targetId: 'section-billing-address', icon: MapPin },
    { label: 'Additional Details', targetId: 'section-additional-details', icon: Coins },
    { label: 'Live Preview', targetId: 'section-live-preview', icon: Eye },
  ];

  const handleSmoothScroll = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-blue-100/55', 'border-blue-400');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-blue-100/55', 'border-blue-400');
      }, 1400);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs sticky top-24 select-none">
      <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
        What You Can Add
      </h3>
      <p className="text-xs text-slate-400 font-semibold mb-4 leading-normal">
        Add client/company details, logo, billing address and more
      </p>

      <div className="space-y-2.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSmoothScroll(card.targetId)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 text-slate-700 hover:text-[#2563EB] font-bold text-xs transition-all duration-200 group text-left cursor-pointer shadow-2xs"
              id={`btn-shortcut-${card.targetId}`}
            >
              <div className="flex items-center gap-3">
                <span className="p-1 px-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 group-hover:text-[#2563EB] group-hover:border-blue-100 transition-all shadow-3xs">
                  <Icon size={14} />
                </span>
                <span>{card.label}</span>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-[#2563EB] transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4 text-[11px] text-slate-400 font-medium leading-relaxed">
        <span className="font-bold text-slate-500 block mb-1">Quick Tip:</span>
        Company name is required. Everything else is optional.
      </div>
    </div>
  );
}

