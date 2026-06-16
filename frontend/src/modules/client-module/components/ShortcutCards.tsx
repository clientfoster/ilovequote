import React from 'react';
import { ChevronRight, Building2, ImageIcon, MapPin, Coins, Eye } from 'lucide-react';

interface ShortcutCard {
  title: string;
  description: string;
  targetId: string;
  icon: React.ElementType;
  accent: string;
}

export default function ShortcutCards() {
  const cards: ShortcutCard[] = [
    {
      title: 'Client / Company Details',
      description: 'Add client name, contact person, email, phone and more.',
      targetId: 'section-client-details',
      icon: Building2,
      accent: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Upload Client Logo',
      description: 'Upload logo to make your quote look more professional.',
      targetId: 'section-client-logo',
      icon: ImageIcon,
      accent: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Billing Address',
      description: 'Add complete billing address that will appear in the quote.',
      targetId: 'section-billing-address',
      icon: MapPin,
      accent: 'bg-violet-50 text-violet-600 border-violet-100',
    },
    {
      title: 'Additional Details',
      description: 'Add tax ID and reference number if required.',
      targetId: 'section-additional-details',
      icon: Coins,
      accent: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Live Preview',
      description: 'See real-time preview of how client details look in your quote.',
      targetId: 'section-live-preview',
      icon: Eye,
      accent: 'bg-sky-50 text-sky-600 border-sky-100',
    },
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
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs sticky top-24 select-none">
      <h3 className="mb-1 text-sm font-bold text-slate-900">What you can add</h3>
      <p className="mb-4 text-xs font-medium leading-normal text-slate-500">
        Add client/company details, logo, billing address and more.
      </p>

      <div className="space-y-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSmoothScroll(card.targetId)}
              className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all hover:border-blue-200 hover:bg-blue-50/20"
              id={`btn-shortcut-${card.targetId}`}
            >
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${card.accent}`}>
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900">{card.title}</span>
                <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-500">
                  {card.description}
                </span>
              </span>
              <ChevronRight size={16} className="mt-2 shrink-0 text-slate-300" />
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] leading-relaxed text-slate-500">
        <span className="mb-1 block font-bold text-slate-700">Quick Tip</span>
        Company name is required. Everything else is optional.
      </div>
    </div>
  );
}
