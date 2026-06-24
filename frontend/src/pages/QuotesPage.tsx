import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown, Copy, Download, Eye, FileText, Filter, Grid2x2, List, MessageCircle, Search, Trash2 } from 'lucide-react';
import { getDisplayAuthUser } from '../auth';
import { downloadFileFromUrl } from '../download';
import { createQuote, deleteQuote, fetchUserQuotes } from '../quoteApi';
import { Quote } from '../types';
import { buildPdfDownloadUrl, buildPdfUrl, buildShareUrl } from '../url';

const statusTabs = ['All', 'Draft', 'Sent', 'Viewed', 'Accepted'] as const;

function formatMoney(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function QuotesPage() {
  const { displayName, initials } = getDisplayAuthUser();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof statusTabs)[number]>('All');

  useEffect(() => {
    fetchUserQuotes().then(setQuotes).catch(() => setQuotes([]));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesSearch =
        !needle ||
        `${quote.quoteNumber} ${quote.businessDetails?.companyName || ''} ${quote.clientDetails?.name || ''}`
          .toLowerCase()
          .includes(needle);
      const effectiveStatus = quote.status === 'Completed' ? 'Accepted' : 'Draft';
      return matchesSearch && (status === 'All' || status === effectiveStatus);
    });
  }, [quotes, query, status]);

  const handleDuplicate = async (quote: Quote) => {
    const duplicate: Partial<Quote> = {
      ...quote,
      id: `${quote.id}-copy-${Date.now()}`,
      quoteNumber: `${quote.quoteNumber}-COPY`,
      date: new Date().toISOString().slice(0, 10),
      status: 'Draft',
    };

    try {
      await createQuote(duplicate);
      const refreshed = await fetchUserQuotes();
      setQuotes(refreshed);
    } catch {
      setQuotes((prev) => [duplicate as Quote, ...prev]);
    }
  };

  const handleDelete = async (quote: Quote) => {
    if (!window.confirm(`Delete ${quote.quoteNumber}?`)) return;
    try {
      await deleteQuote(quote.id);
    } finally {
      setQuotes((prev) => prev.filter((item) => item.id !== quote.id));
    }
  };

  const getShareUrl = (quote: Quote) => buildShareUrl(quote.shareToken || quote.quoteNumber);

  const copyShareLink = async (quote: Quote) => {
    const shareUrl = getShareUrl(quote);
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.prompt('Copy this link', shareUrl);
    }
  };

  const openQuotePdf = (quoteId: string) => {
    window.open(buildPdfUrl(quoteId), '_blank', 'noopener,noreferrer');
  };

  const downloadQuotePdf = (quoteId: string) => {
    return downloadFileFromUrl(buildPdfDownloadUrl(quoteId), `${quoteId}.pdf`);
  };

  const shareViaWhatsApp = (quote: Quote) => {
    const shareUrl = getShareUrl(quote);
    const text = encodeURIComponent(`Hello! Here is your quotation from ${quote.businessDetails?.companyName || 'our team'}. Quote Number: ${quote.quoteNumber}. Review details here: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">My Quotes</h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500">
              {displayName} can manage, share and download saved quotes here.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {Math.min(9, quotes.length)}
              </span>
            </button>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2457F0] text-[13px] font-semibold text-white shadow-sm">
              {initials}
            </button>
            <button type="button" className="flex items-center gap-2 text-[14px] font-medium text-slate-800">
              {displayName}
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 overflow-x-auto">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatus(tab)}
                  className={`whitespace-nowrap border-b-2 px-1 pb-3 text-[15px] font-semibold ${status === tab ? 'border-[#2457F0] text-[#2457F0]' : 'border-transparent text-slate-500'}`}
                >
                  {tab === 'All' ? 'All Quotes' : tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-11 w-[290px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search className="h-5 w-5 shrink-0 text-slate-800" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search quotes by name or client..."
                  className="w-full border-none bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <button type="button" className="inline-flex h-11 min-w-[175px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 shadow-sm">
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-4.5 w-4.5 text-slate-700" />
                  {status}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              <div className="h-9 w-px bg-slate-200" />

              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2457F0] text-white" aria-label="List view">
                  <List className="h-4.5 w-4.5" />
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700" aria-label="Grid view">
                  <Grid2x2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1320px] w-full border-collapse text-left">
              <thead className="bg-[#FBFCFF]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                  <th className="px-4 py-4 md:px-5">Quote Name</th>
                  <th className="px-4 py-4 md:px-5">Client</th>
                  <th className="px-4 py-4 md:px-5">Amount</th>
                  <th className="px-4 py-4 md:px-5">Status</th>
                  <th className="px-4 py-4 md:px-5">Created On</th>
                  <th className="px-4 py-4 md:px-5">Share Link</th>
                  <th className="px-4 py-4 md:px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                      No quotes saved yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((quote) => {
                    const activeStatus = quote.status === 'Completed' ? 'Accepted' : 'Draft';
                    return (
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
                        <td className="px-4 py-5 md:px-5 font-semibold text-slate-900">{formatMoney(quote.totalAmount)}</td>
                        <td className="px-4 py-5 md:px-5">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${activeStatus === 'Accepted' ? 'bg-[#E9FCEB] text-[#16A34A]' : 'bg-[#F3F4F6] text-[#475569]'}`}>
                            {activeStatus}
                          </span>
                        </td>
                        <td className="px-4 py-5 md:px-5">
                          <p className="font-medium text-slate-700">{quote.date}</p>
                          <p className="mt-1 text-[12px] text-slate-500">{quote.expiryDate}</p>
                        </td>
                        <td className="px-4 py-5 md:px-5">
                          <div className="flex flex-col items-start gap-1.5">
                            <button
                              type="button"
                              onClick={() => openQuotePdf(quote.id)}
                              className="max-w-[180px] break-all text-left text-[13px] leading-5 font-medium text-[#2457F0] underline decoration-[#2457F0]/30 underline-offset-4 hover:text-[#1D4ED8]"
                              title="Open quote PDF"
                            >
                              {getShareUrl(quote)}
                            </button>
                            <button type="button" onClick={() => copyShareLink(quote)} className="text-[13px] font-semibold text-[#2457F0]">
                              Copy
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-5 md:px-5">
                          <div className="flex items-center justify-center gap-3">
                            <button type="button" onClick={() => openQuotePdf(quote.id)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Open PDF">
                              <Eye className="h-4.5 w-4.5 text-[#2457F0]" />
                            </button>
                            <button type="button" onClick={() => shareViaWhatsApp(quote)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Share on WhatsApp">
                              <MessageCircle className="h-4.5 w-4.5 text-[#16A34A]" />
                            </button>
                            <button type="button" onClick={() => downloadQuotePdf(quote.id)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                              <Download className="h-4.5 w-4.5 text-[#EF4444]" />
                            </button>
                            <button type="button" onClick={() => handleDuplicate(quote)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                              <Copy className="h-4.5 w-4.5 text-[#7C3AED]" />
                            </button>
                            <button type="button" onClick={() => handleDelete(quote)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                              <Trash2 className="h-4.5 w-4.5 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
