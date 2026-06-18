import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Layers3, 
  TrendingUp, 
  PlusCircle, 
  Calendar, 
  HelpCircle, 
  Heart,
  ChevronRight,
  TrendingDown,
  Clock,
  Sparkles,
  Building,
  User,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Quote } from '../types';

const QUOTES_STORAGE_KEY = 'ilovequote_saved_quotes';

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const navigate = useNavigate();

  // Load quotes from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUOTES_STORAGE_KEY);
      if (saved) {
        setQuotes(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to read quotes inside dashboard", e);
    }
  }, []);

  const totalQuotesCount = quotes.length;
  const draftQuotesCount = quotes.filter(q => q.status === 'Draft').length;
  const completedQuotesCount = quotes.filter(q => q.status === 'Completed').length;
  
  // Calculate total worth of completed invoices
  const totalVolume = quotes
    .filter(q => q.status === 'Completed')
    .reduce((sum, q) => sum + (q.totalAmount || 0), 0);

  // Sorting quote descending of date (most recent first)
  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 md:p-8" id="dashboard-page-wrapper">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HERO HEADER JUMBOTRON CARD */}
        <div className="relative bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 rounded-[2rem] p-6 md:p-10 text-white overflow-hidden shadow-xl" id="dashboard-hero-banner">
          
          {/* Ambient Design Details */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#1D4ED8] opacity-15 blur-3xl rounded-full" />
          <div className="absolute left-1/4 top-10 w-24 h-24 bg-blue-500 opacity-10 blur-2xl rounded-full" />

          <div className="relative z-10 space-y-4 md:space-y-6 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-400/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Dynamic Invoice Hub
            </span>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-none text-white font-sans">
                Streamline Your <span className="text-[#3B82F6]">Billing</span> & Proposals
              </h1>
              <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-semibold">
                Generate high-converting PDF quotation proposals instantly, share dynamic portfolios containing secure QR links, and track draft invoices on the fly.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  localStorage.removeItem('ilovequote_editing_quote_id'); // Ensure it starts fresh empty state
                  navigate('/create-quote');
                }}
                className="inline-flex items-center gap-2 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-black px-6 py-3 rounded-xl shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                Create New Quote
              </button>
            </div>
          </div>
        </div>

        {/* METRICS STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="dashboard-stats-grid">
          
          {/* STAT 1: TOTAL QUOTES */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-blue-100 transition-all">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Quotes</span>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {totalQuotesCount}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 font-medium">
                <span className="text-blue-600 font-extrabold">All items managed</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          {/* STAT 2: COMPLETED QUOTES */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-emerald-100 transition-all">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {completedQuotesCount}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 font-medium">
                <span className="text-emerald-650 font-extrabold">✓ Finalized quotes</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          {/* STAT 3: PENDING DRAFTS */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-amber-100 transition-all">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drafts</span>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {draftQuotesCount}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 font-medium">
                <span className="text-amber-600 font-extrabold">⚡ Autoclose awaiting</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          {/* STAT 4: TOTAL REVENUE VOLUME */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-[#1D4ED8]/30 transition-all">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Volume</span>
              <p className="text-2xl md:text-3xl font-black text-[#1D4ED8] tracking-tight leading-none">
                ${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 font-medium">
                <span className="text-sky-600 font-extrabold">Total invoice value</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0">
              <PlusCircle className="w-6 h-6 stroke-[2] rotate-45" />
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: RECENT QUOTES & ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* COLUMN 1 & 2: RECENT QUOTES LIST TABLE */}
          <div className="lg:col-span-2 bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Recent Quote Records
              </span>
              <button 
                onClick={() => navigate('/quotes')}
                className="text-[11px] text-[#1D4ED8] font-bold hover:underline inline-flex items-center gap-0.5"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentQuotes.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-450">No files stored yet. Launch setup to generate your first quotation.</p>
                <button
                  onClick={() => navigate('/create-quote')}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Create Quote
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100" id="recent-quotes-list">
                {recentQuotes.map((q) => (
                  <div 
                    key={q.id}
                    onClick={() => navigate('/quotes')}
                    className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-55/35 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-850">{q.businessDetails?.companyName}</span>
                          <span className="text-[9px] text-[#1D4ED8] font-mono bg-blue-50 px-1.5 py-0.5 rounded-sm font-extrabold">{q.quoteNumber}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <User className="w-3 h-3" />
                          Client: <span className="font-bold text-slate-605">{q.clientDetails?.name || 'N/A'}</span>
                          <span className="text-slate-200">|</span>
                          <Calendar className="w-3 h-3" />
                          {q.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-xs font-black text-slate-900">${q.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits:2 })}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                        q.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-750 border-emerald-100'
                          : 'bg-amber-50 text-amber-750 border-amber-100'
                      }`}>
                        {q.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 3: HOW IT WORKS / TIPS */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest block pb-2 border-b border-indigo-50">
              Interactive Workflow
            </span>
            
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-black text-[10px] shrink-0">1</span>
                <div>
                  <h4 className="font-extrabold text-slate-900">Define Business Details</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium mt-0.5">Set up logo, addresses and configure tax registrations.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-black text-[10px] shrink-0">2</span>
                <div>
                  <h4 className="font-extrabold text-slate-900">Specify Clients & Items</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium mt-0.5">Onboard client addresses and document pricing breakdown lines.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-black text-[10px] shrink-0">3</span>
                <div>
                  <h4 className="font-extrabold text-slate-900">Render & Download</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium mt-0.5">Visually test quotes inside mockup and print direct PDF bills.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100/40 rounded-xl p-3.5 space-y-1">
              <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3 fill-current" />
                Design Note
              </h5>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Your data is held 100% locally in this terminal. No quotes or client lists leak to external networks, protecting sensitive financial items.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
