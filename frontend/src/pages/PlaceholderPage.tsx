import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] flex flex-col justify-center items-center p-6 md:p-12" id={`placeholder-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-150 p-8 shadow-xs text-center flex flex-col items-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shadow-xs">
          {icon}
        </div>
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-full text-[10px] font-black text-[#1D4ED8] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Core Feature Coming Soon
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => navigate('/create-quote')}
            className="flex-1 py-3 px-4 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-100"
          >
            Create Quote
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
