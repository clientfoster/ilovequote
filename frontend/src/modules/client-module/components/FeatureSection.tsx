import React from 'react';
import { UserMinus, Save, Compass, Smartphone, Smile } from 'lucide-react';

export default function FeatureSection() {
  const features = [
    {
      title: 'No Account Required',
      description: 'Use instantly without sign up',
      icon: UserMinus,
      color: 'bg-indigo-50 border-indigo-100 text-indigo-600'
    },
    {
      title: 'Auto Save',
      description: 'Your progress is saved automatically',
      icon: Save,
      color: 'bg-emerald-50 border-emerald-100 text-emerald-600'
    },
    {
      title: 'Easy Navigation',
      description: 'Move between steps easily',
      icon: Compass,
      color: 'bg-sky-50 border-sky-100 text-sky-600'
    },
    {
      title: 'Mobile Friendly',
      description: 'Works perfectly on all devices',
      icon: Smartphone,
      color: 'bg-amber-50 border-amber-100 text-amber-600'
    },
    {
      title: '100% Free',
      description: 'Create unlimited quotes for free forever',
      icon: Smile,
      color: 'bg-blue-50 border-blue-100 text-[#2563EB]'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-3xs select-none">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">
        Pro Quotation Platform Capabilities
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="group flex flex-col items-center md:items-start text-center md:text-left gap-3.5 p-4 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all duration-200"
              id={`feature-card-${idx}`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${feat.color} shadow-3xs group-hover:scale-105 transition-transform`}>
                <Icon size={18} />
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors">
                  {feat.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

