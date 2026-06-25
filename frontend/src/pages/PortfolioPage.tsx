import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, Download, Eye, FileText, MoreVertical, PieChart, Search, TrendingUp, Users } from 'lucide-react';
import { getDisplayAuthUser } from '../auth';
import { fetchUserQuotes } from '../quoteApi';
import { Quote } from '../types';
import { buildPdfDownloadUrl, buildPdfUrl, buildShareUrl } from '../url';

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function PortfolioPage() {
  const { displayName, initials } = getDisplayAuthUser();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchUserQuotes().then(setQuotes).catch(() => setQuotes([]));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return quotes.filter((quote) => !needle || `${quote.quoteNumber} ${quote.businessDetails?.companyName || ''} ${quote.clientDetails?.name || ''}`.toLowerCase().includes(needle));
  }, [quotes, query]);

  const stats = [
    { label: 'Total Quotes', value: String(quotes.length), helper: 'All time quotes', icon: FileText, tone: 'bg-[#EEF2FF] text-[#2457F0]' },
    { label: 'Total Revenue', value: money(quotes.reduce((sum, quote) => sum + quote.totalAmount, 0)), helper: 'Across all quotes', icon: TrendingUp, tone: 'bg-[#E9FCEB] text-[#16A34A]' },
    { label: 'Total Clients', value: String(new Set(quotes.map((quote) => quote.clientDetails?.email || quote.clientDetails?.name)).size), helper: 'Unique clients', icon: Users, tone: 'bg-[#F1EDFF] text-[#7C3AED]' },
    { label: 'Conversion Rate', value: `${quotes.length ? Math.round((quotes.filter((quote) => quote.status === 'Completed').length / quotes.length) * 100) : 0}%`, helper: 'Quotes accepted', icon: PieChart, tone: 'bg-[#FFF0E1] text-[#F97316]' },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">My Portfolio</h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500">Overview based on the saved data in your account.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2457F0] text-[13px] font-semibold text-white shadow-sm">
              {initials}
            </button>
            <button type="button" className="flex items-center gap-2 text-[14px] font-medium text-slate-800">
              {displayName}
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
                <div className="flex items-center gap-4">
                  <div className={`flex h-[56px] w-[56px] items-center justify-center rounded-[14px] ${stat.tone}`}>
                    <Icon className="h-[28px] w-[28px] stroke-[1.9]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-700">{stat.label}</p>
                    <p className="mt-1 text-[34px] font-bold leading-none tracking-tight text-slate-900">{stat.value}</p>
                    <p className="mt-2 text-[12px] font-medium text-slate-500">{stat.helper}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-4">
                <button type="button" className="border-b-2 border-[#2457F0] pb-3 text-[15px] font-semibold text-[#2457F0]">Quotes Overview</button>
              </div>
              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm">
                <Calendar className="h-4 w-4 text-slate-600" />
                Saved data
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-left">
                <thead className="bg-[#FBFCFF]">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                    <th className="px-4 py-4 md:px-5">Quote Name</th>
                    <th className="px-4 py-4 md:px-5">Client</th>
                    <th className="px-4 py-4 md:px-5">Amount</th>
                    <th className="px-4 py-4 md:px-5">Status</th>
                    <th className="px-4 py-4 md:px-5">Date</th>
                    <th className="px-4 py-4 md:px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                        No portfolio data yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((quote) => (
                      <tr key={quote.id} className="border-t border-slate-200/70 text-[14px]">
                        <td className="px-4 py-5 md:px-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2457F0]">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{quote.businessDetails?.companyName || 'Untitled Quote'}</p>
                              <p className="mt-1 text-[12px] text-slate-500">{quote.quoteNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 md:px-5">
                          <div>
                            <p className="font-medium text-slate-900">{quote.clientDetails?.name || 'Client'}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{quote.clientDetails?.email || ''}</p>
                          </div>
                        </td>
                        <td className="px-4 py-5 md:px-5 font-semibold text-slate-900">{money(quote.totalAmount)}</td>
                        <td className="px-4 py-5 md:px-5">
                          <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold bg-[#F3F4F6] text-[#475569]">
                            {quote.status === 'Completed' ? 'Accepted' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-5 md:px-5">
                          <p className="font-medium text-slate-700">{quote.date}</p>
                          <p className="mt-1 text-[12px] text-slate-500">{quote.expiryDate}</p>
                        </td>
                        <td className="px-4 py-5 md:px-5">
                          <div className="flex items-center justify-center gap-3">
                            <button type="button" onClick={() => window.open(buildPdfUrl(quote.id), '_blank', 'noopener,noreferrer')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                              <Eye className="h-4.5 w-4.5 text-[#2457F0]" />
                            </button>
                            <button type="button" onClick={() => window.open(buildPdfDownloadUrl(quote.id), '_blank', 'noopener,noreferrer')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                              <Download className="h-4.5 w-4.5 text-[#EF4444]" />
                            </button>
                            <button type="button" onClick={async () => {
                              const shareUrl = buildShareUrl(quote.shareToken || quote.quoteNumber);
                              try {
                                await navigator.clipboard.writeText(shareUrl);
                              } catch {
                                window.prompt('Copy this link', shareUrl);
                              }
                            }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                              <MoreVertical className="h-4.5 w-4.5 text-slate-700" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Top Clients</h3>
              <div className="mt-4 space-y-3">
                {Array.from(
                  new Map(
                    quotes.map((quote) => [quote.clientDetails?.name || 'Client', quote.totalAmount]),
                  ).entries(),
                )
                  .slice(0, 5)
                  .map(([name, amount]) => (
                    <div key={name} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{name}</span>
                      <span className="text-sm font-semibold text-slate-900">{money(amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
