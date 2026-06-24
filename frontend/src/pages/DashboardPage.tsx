import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileText,
  Link2,
  Package,
  Plus,
  Search,
  Send,
  Share2,
  Star,
  Users,
  Trash2,
} from 'lucide-react';
import { Quote } from '../types';
import { getDisplayAuthUser } from '../auth';
import { downloadFileFromUrl } from '../download';
import { createQuote, deleteQuote, fetchUserQuotes } from '../quoteApi';
import { buildAppUrl, buildPdfDownloadUrl, buildPdfUrl, buildShareUrl } from '../url';

type DashboardQuote = Quote & {
  title: string;
  clientLabel: string;
  amountLabel: string;
  createdLabel: string;
  statusLabel: 'Created' | 'Viewed' | 'Sent' | 'Accepted' | 'Draft';
  activityLabel: string;
  activityTime: string;
  clientInitials: string;
  accent: string;
};

const quoteStatusOptions = ['All Status', 'Created', 'Viewed', 'Sent', 'Accepted', 'Draft'] as const;
const accentPalette = ['bg-[#EEF2FF] text-[#2457F0]', 'bg-[#E9FCEB] text-[#22C55E]', 'bg-[#FFF0E1] text-[#F97316]', 'bg-[#F1EDFF] text-[#7C3AED]', 'bg-[#FFF4F0] text-[#EF4444]'];

function formatMoney(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function initialsFor(name?: string) {
  const parts = String(name || 'Client').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'C';
}

function mapQuote(quote: Quote, index: number): DashboardQuote {
  const statusLabel = quote.status === 'Completed' ? 'Accepted' : 'Draft';
  return {
    ...quote,
    title: quote.businessDetails?.companyName || quote.quoteNumber || 'Untitled Quote',
    clientLabel: quote.clientDetails?.name || 'Client',
    amountLabel: formatMoney(quote.totalAmount),
    createdLabel: quote.date,
    statusLabel,
    activityLabel: statusLabel === 'Accepted' ? 'Accepted' : 'Created',
    activityTime: quote.expiryDate || quote.date,
    clientInitials: initialsFor(quote.clientDetails?.name),
    accent: accentPalette[index % accentPalette.length],
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { displayName, initials } = getDisplayAuthUser();
  const [quotes, setQuotes] = useState<DashboardQuote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof quoteStatusOptions)[number]>('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    let active = true;
    fetchUserQuotes()
      .then((items) => {
        if (!active) return;
        setQuotes(items.map((quote, index) => mapQuote(quote, index)));
      })
      .catch(() => {
        if (active) setQuotes([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredQuotes = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesSearch =
        !needle ||
        `${quote.title} ${quote.clientLabel} ${quote.quoteNumber} ${quote.statusLabel}`
          .toLowerCase()
          .includes(needle);
      const matchesStatus = statusFilter === 'All Status' || quote.statusLabel === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  const totalQuotesCount = quotes.length;
  const totalVolume = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);
  const viewedQuotesCount = quotes.filter((quote) => quote.statusLabel === 'Viewed').length;
  const acceptedQuotesCount = quotes.filter((quote) => quote.statusLabel === 'Accepted').length;

  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / rowsPerPage));
  const visibleQuotes = filteredQuotes.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handleDuplicate = async (quote: DashboardQuote) => {
    const duplicate: Partial<Quote> = {
      id: `${quote.id}-copy-${Date.now()}`,
      quoteNumber: `${quote.quoteNumber}-COPY`,
      date: new Date().toISOString().slice(0, 10),
      expiryDate: quote.expiryDate,
      status: 'Draft',
      businessDetails: quote.businessDetails,
      clientDetails: quote.clientDetails,
      items: quote.items,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      terms: quote.terms,
    };

    try {
      await createQuote(duplicate);
      const refreshed = await fetchUserQuotes();
      setQuotes(refreshed.map((item, index) => mapQuote(item, index)));
      setCurrentPage(1);
    } catch {
      setQuotes((prev) => [mapQuote(duplicate as Quote, 0), ...prev]);
      setCurrentPage(1);
    }
  };

  const handleDelete = async (quote: DashboardQuote) => {
    if (!window.confirm(`Delete ${quote.title}?`)) return;

    try {
      await deleteQuote(quote.id);
      setQuotes((prev) => prev.filter((item) => item.id !== quote.id));
    } catch {
      setQuotes((prev) => prev.filter((item) => item.id !== quote.id));
    }
  };

  const actionTiles = [
    {
      label: 'View',
      icon: Eye,
      tone: 'text-[#2457F0]',
      onClick: (quote: DashboardQuote) => window.open(buildPdfUrl(quote.id), '_blank', 'noopener,noreferrer'),
      ariaLabel: (quote: DashboardQuote) => `View ${quote.title}`,
    },
    {
      label: 'Share',
      icon: Link2,
      tone: 'text-[#22C55E]',
      onClick: async (quote: DashboardQuote) => {
        const shareUrl = buildShareUrl(quote.shareToken || quote.quoteNumber);
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          window.prompt('Copy this link', shareUrl);
        }
      },
      ariaLabel: (quote: DashboardQuote) => `Share ${quote.title}`,
    },
    {
      label: 'PDF',
      icon: Download,
      tone: 'text-[#EF4444]',
      onClick: async (quote: DashboardQuote) => downloadFileFromUrl(buildPdfDownloadUrl(quote.id), `${quote.quoteNumber || quote.id}.pdf`),
      ariaLabel: (quote: DashboardQuote) => `Download ${quote.title}`,
    },
    {
      label: 'Dup',
      icon: Copy,
      tone: 'text-[#7C3AED]',
      onClick: (quote: DashboardQuote) => handleDuplicate(quote),
      ariaLabel: (quote: DashboardQuote) => `Duplicate ${quote.title}`,
    },
    {
      label: 'Del',
      icon: Trash2,
      tone: 'text-[#EF4444]',
      onClick: (quote: DashboardQuote) => handleDelete(quote),
      ariaLabel: (quote: DashboardQuote) => `Delete ${quote.title}`,
    },
  ] as const;

  const activityFeed = (quotes.slice(0, 4).map((quote) => ({
    icon: quote.statusLabel === 'Accepted' ? Package : quote.statusLabel === 'Viewed' ? Eye : Send,
    iconWrap: quote.statusLabel === 'Accepted' ? 'bg-[#E9FCEB] text-[#22C55E]' : quote.statusLabel === 'Viewed' ? 'bg-[#EEF2FF] text-[#2457F0]' : 'bg-[#F1EDFF] text-[#7C3AED]',
    title: `Quote ${quote.statusLabel.toLowerCase()}`,
    subtitle: quote.title,
    time: quote.activityTime,
  })));

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-[#F8FAFC] p-4 md:p-6" id="dashboard-page-wrapper">
      <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-5 overflow-hidden">
        <div className="flex flex-col gap-2 pb-1">
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[28px]">
              Welcome back, {displayName}
            </h1>
            <p className="mt-1 text-[13px] font-medium text-slate-500 md:text-[14px]">
              Create, manage and share your price quotes in one place.
            </p>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Quotes', value: totalQuotesCount.toString(), helper: 'All time quotes created', icon: FileText, wrap: 'bg-[#EEF2FF] text-[#2457F0]' },
            { label: 'Total Amount', value: formatMoney(totalVolume), helper: 'Across all quotes', icon: Star, wrap: 'bg-[#E8FAEF] text-[#22C55E]' },
            { label: 'Viewed Quotes', value: viewedQuotesCount.toString(), helper: 'Quotes viewed by clients', icon: Eye, wrap: 'bg-[#FFF4E6] text-[#F59E0B]' },
            { label: 'Accepted Quotes', value: acceptedQuotesCount.toString(), helper: 'Quotes accepted by clients', icon: Package, wrap: 'bg-[#F1EDFF] text-[#7C3AED]' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-[14px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
                <div className="flex items-center gap-4">
                  <div className={`flex h-[56px] w-[56px] items-center justify-center rounded-[14px] ${stat.wrap}`}>
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

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1fr)_270px]">
          <div className="min-h-0 rounded-[14px] border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
            <div className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-5">
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900 md:text-[20px]">My Quotes</h2>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex w-full items-center rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:w-[250px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search quotes..."
                    className="w-full border-none bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  <Search className="h-4.5 w-4.5 shrink-0 text-slate-700" />
                </div>

                <button
                  type="button"
                  onClick={() => setStatusFilter((prev) => quoteStatusOptions[(quoteStatusOptions.indexOf(prev) + 1) % quoteStatusOptions.length])}
                  className="inline-flex items-center justify-between gap-3 rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-[14px] font-medium text-slate-700 shadow-sm sm:w-[200px]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-slate-700" />
                    {statusFilter}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-200/70" />

            <div className="overflow-hidden">
              <table className="min-w-[1100px] w-full border-collapse text-left">
                <thead className="bg-[#FBFCFF]">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                    <th className="px-4 py-4 md:px-5">Quote Name</th>
                    <th className="px-4 py-4 md:px-5">Client</th>
                    <th className="px-4 py-4 md:px-5">Amount</th>
                    <th className="px-4 py-4 md:px-5">Status</th>
                    <th className="px-4 py-4 md:px-5">Created On</th>
                    <th className="px-4 py-4 md:px-5 text-center min-w-[360px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleQuotes.length === 0 ? (
                    <tr>
                      <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={6}>
                        No quotes found for this account yet.
                      </td>
                    </tr>
                  ) : visibleQuotes.map((quote) => (
                    <tr key={quote.id} className="border-t border-slate-200/70 text-[14px]">
                      <td className="px-4 py-4 md:px-5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${quote.accent}`}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{quote.title}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{quote.quoteNumber || quote.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 md:px-5">
                        <div>
                          <p className="font-medium text-slate-900">{quote.clientLabel}</p>
                          <p className="mt-1 text-[12px] text-slate-500">{quote.clientDetails?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 md:px-5 font-semibold text-slate-900">{quote.amountLabel}</td>
                      <td className="px-4 py-4 md:px-5">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${quote.statusLabel === 'Accepted' ? 'bg-[#E9FCEB] text-[#16A34A]' : 'bg-[#F3F4F6] text-[#475569]'}`}>
                          {quote.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-5">
                        <p className="font-medium text-slate-700">{quote.createdLabel}</p>
                        <p className="mt-1 text-[12px] text-slate-500">{quote.activityTime}</p>
                      </td>
                      <td className="px-4 py-4 md:px-5">
                        <div className="grid grid-cols-5 items-start justify-items-center gap-3 whitespace-nowrap">
                          {actionTiles.map((action) => {
                            const Icon = action.icon;
                            return (
                              <div key={action.label} className="flex flex-col items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => action.onClick(quote)}
                                  className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
                                  aria-label={action.ariaLabel(quote)}
                                >
                                  <Icon className={`h-5 w-5 ${action.tone}`} />
                                </button>
                                <span className="text-[11px] font-medium text-slate-700">{action.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200/70 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
              <p className="text-[14px] font-medium text-slate-600">
                Showing {filteredQuotes.length === 0 ? 0 : Math.min((currentPage - 1) * rowsPerPage + 1, filteredQuotes.length)} to{' '}
                {Math.min(currentPage * rowsPerPage, filteredQuotes.length)} of {filteredQuotes.length} quotes
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center justify-center gap-1">
                  <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50" aria-label="Previous page">
                    <span className="text-[18px] leading-none">{'<'}</span>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    const pageNumber = index + 1;
                    const isActive = pageNumber === currentPage;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`flex h-10 w-10 items-center justify-center rounded-[10px] border text-sm font-semibold ${isActive ? 'border-[#2457F0] bg-[#F4F7FF] text-[#2457F0]' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50" aria-label="Next page">
                    <span className="text-[18px] leading-none">{'>'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[14px] font-medium text-slate-600">
                  <span>Rows per page</span>
                  <button type="button" onClick={() => setRowsPerPage((prev) => (prev === 5 ? 10 : prev === 10 ? 25 : 5))} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm">
                    {rowsPerPage}
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5 xl:max-h-full xl:overflow-hidden">
            <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Quick Actions</h3>
              <p className="mt-3 text-[14px] leading-6 text-slate-500">Create a quote or browse your saved work.</p>
              <button type="button" onClick={() => navigate('/create-quote')} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#2457F0] px-4 py-3 text-[15px] font-semibold text-white">
                <Plus className="h-4.5 w-4.5" />
                New Quote
              </button>
              <button type="button" onClick={() => navigate('/quotes')} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold text-[#2457F0]">
                <ArrowRight className="h-4.5 w-4.5" />
                Open Quotes
              </button>
            </div>

            <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Recent Activity</h3>
              <div className="mt-4 space-y-4">
                {(activityFeed.length > 0 ? activityFeed : [
                  { icon: FileText, iconWrap: 'bg-slate-100 text-slate-500', title: 'No activity yet', subtitle: 'Create your first quote to see updates here', time: 'Just now' },
                ]).map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={`${activity.title}-${activity.time}`} className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activity.iconWrap}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-[12px] text-slate-500">{activity.subtitle}</p>
                        <p className="text-[11px] text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>

        <button
          type="button"
          onClick={async () => {
            const helpUrl = buildAppUrl('/help-support');
            try {
              await navigator.clipboard.writeText(helpUrl);
            } catch {
              window.prompt('Copy this link', helpUrl);
            }
          }}
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#2457F0] shadow-lg shadow-slate-200"
        >
          <Share2 className="h-4 w-4" />
          Help & Support
        </button>
      </div>
    </div>
  );
}
