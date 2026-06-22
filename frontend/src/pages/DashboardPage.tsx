import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Link2,
  Package,
  PanelTopOpen,
  Plus,
  Search,
  Send,
  Share2,
  Star,
  Users,
  Download,
  ArrowRight,
} from 'lucide-react';
import { Quote } from '../types';
import { getScopedStorageKey } from '../auth';

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

const sampleQuotes: DashboardQuote[] = [
  {
    id: 'q-2026-001',
    quoteNumber: 'Q-2026-001',
    title: 'Website Development Package 2026',
    clientLabel: 'Swanish Healthcare',
    amountLabel: '₹35,500',
    createdLabel: '16 May 2024',
    status: 'Draft',
    statusLabel: 'Created',
    activityLabel: 'Created',
    activityTime: '10:30 AM',
    clientInitials: 'DS',
    accent: 'bg-[#EEF2FF] text-[#2457F0]',
    date: '16 May 2024',
    expiryDate: '23 May 2024',
    businessDetails: {
      companyName: 'ilovequote.com',
      tagline: '',
      email: '',
      phone: '',
      website: '',
      logo: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      taxType: 'GSTIN',
      taxId: '',
      socialLinks: [],
      businessSlug: '',
    },
    clientDetails: { name: 'Dr. Swanish', email: '', phone: '', address: '' },
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 35500,
    terms: '',
  },
  {
    id: 'q-2026-002',
    quoteNumber: 'Q-2026-002',
    title: 'SEO Marketing Services',
    clientLabel: 'Bright Future Pvt Ltd',
    amountLabel: '₹22,000',
    createdLabel: '14 May 2024',
    status: 'Draft',
    statusLabel: 'Viewed',
    activityLabel: 'Viewed',
    activityTime: '03:15 PM',
    clientInitials: 'BS',
    accent: 'bg-[#E9FCEB] text-[#22C55E]',
    date: '14 May 2024',
    expiryDate: '21 May 2024',
    businessDetails: {
      companyName: 'ilovequote.com',
      tagline: '',
      email: '',
      phone: '',
      website: '',
      logo: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      taxType: 'GSTIN',
      taxId: '',
      socialLinks: [],
      businessSlug: '',
    },
    clientDetails: { name: 'John Smith', email: '', phone: '', address: '' },
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 22000,
    terms: '',
  },
  {
    id: 'q-2026-003',
    quoteNumber: 'Q-2026-003',
    title: 'Logo Design & Branding',
    clientLabel: 'ABC Company',
    amountLabel: '₹12,500',
    createdLabel: '12 May 2024',
    status: 'Draft',
    statusLabel: 'Sent',
    activityLabel: 'Sent',
    activityTime: '11:20 AM',
    clientInitials: 'AV',
    accent: 'bg-[#FFF0E1] text-[#F97316]',
    date: '12 May 2024',
    expiryDate: '19 May 2024',
    businessDetails: {
      companyName: 'ilovequote.com',
      tagline: '',
      email: '',
      phone: '',
      website: '',
      logo: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      taxType: 'GSTIN',
      taxId: '',
      socialLinks: [],
      businessSlug: '',
    },
    clientDetails: { name: 'Amit Verma', email: '', phone: '', address: '' },
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 12500,
    terms: '',
  },
  {
    id: 'q-2026-004',
    quoteNumber: 'Q-2026-004',
    title: 'E-commerce Website',
    clientLabel: 'Fashion World',
    amountLabel: '₹75,000',
    createdLabel: '09 May 2024',
    status: 'Draft',
    statusLabel: 'Accepted',
    activityLabel: 'Accepted',
    activityTime: '05:45 PM',
    clientInitials: 'NK',
    accent: 'bg-[#FFF0F0] text-[#F43F5E]',
    date: '09 May 2024',
    expiryDate: '16 May 2024',
    businessDetails: {
      companyName: 'ilovequote.com',
      tagline: '',
      email: '',
      phone: '',
      website: '',
      logo: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      taxType: 'GSTIN',
      taxId: '',
      socialLinks: [],
      businessSlug: '',
    },
    clientDetails: { name: 'Neha Kapoor', email: '', phone: '', address: '' },
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 75000,
    terms: '',
  },
  {
    id: 'q-2026-005',
    quoteNumber: 'Q-2026-005',
    title: 'Mobile App Development',
    clientLabel: 'TechNova Inc.',
    amountLabel: '₹1,25,000',
    createdLabel: '07 May 2024',
    status: 'Draft',
    statusLabel: 'Draft',
    activityLabel: 'Draft',
    activityTime: '09:10 AM',
    clientInitials: 'RK',
    accent: 'bg-[#EDE7FF] text-[#7C3AED]',
    date: '07 May 2024',
    expiryDate: '14 May 2024',
    businessDetails: {
      companyName: 'ilovequote.com',
      tagline: '',
      email: '',
      phone: '',
      website: '',
      logo: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      taxType: 'GSTIN',
      taxId: '',
      socialLinks: [],
      businessSlug: '',
    },
    clientDetails: { name: 'Ravi Kumar', email: '', phone: '', address: '' },
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 125000,
    terms: '',
  },
];

const recentActivity = [
  {
    icon: Eye,
    iconWrap: 'bg-[#EEF2FF] text-[#2457F0]',
    title: 'Quote viewed',
    subtitle: 'Website Development Package 2026',
    time: '2 hours ago',
  },
  {
    icon: PanelTopOpen,
    iconWrap: 'bg-[#E9FCEB] text-[#22C55E]',
    title: 'Quote accepted',
    subtitle: 'E-commerce Website',
    time: '1 day ago',
  },
  {
    icon: Download,
    iconWrap: 'bg-[#FFF0F0] text-[#EF4444]',
    title: 'Quote downloaded',
    subtitle: 'SEO Marketing Services',
    time: '2 days ago',
  },
  {
    icon: Send,
    iconWrap: 'bg-[#F1EDFF] text-[#7C3AED]',
    title: 'Quote sent',
    subtitle: 'Logo Design & Branding',
    time: '3 days ago',
  },
];

const quoteStatusOptions = ['All Status', 'Created', 'Viewed', 'Sent', 'Accepted', 'Draft'] as const;

export default function DashboardPage() {
  const navigate = useNavigate();
  const QUOTES_STORAGE_KEY = getScopedStorageKey('ilovequote_saved_quotes');
  const [quotes, setQuotes] = useState<DashboardQuote[]>(sampleQuotes);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof quoteStatusOptions)[number]>('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUOTES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Quote[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: DashboardQuote[] = parsed.slice(0, 5).map((quote, index) => ({
            ...sampleQuotes[index],
            id: quote.id,
            quoteNumber: quote.quoteNumber,
            title: quote.businessDetails?.companyName || sampleQuotes[index].title,
            clientLabel: quote.clientDetails?.name || sampleQuotes[index].clientLabel,
            amountLabel: `₹${quote.totalAmount.toLocaleString('en-IN')}`,
            createdLabel: quote.date,
            statusLabel: quote.status === 'Completed' ? 'Accepted' : 'Draft',
            activityLabel: quote.status === 'Completed' ? 'Accepted' : 'Created',
            activityTime: sampleQuotes[index].activityTime,
            clientInitials: (quote.clientDetails?.name || 'C')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('')
              .slice(0, 2) || 'C',
            totalAmount: quote.totalAmount,
            businessDetails: quote.businessDetails,
            clientDetails: quote.clientDetails,
            items: quote.items,
            subtotal: quote.subtotal,
            taxRate: quote.taxRate,
            taxAmount: quote.taxAmount,
            terms: quote.terms,
            date: quote.date,
            expiryDate: quote.expiryDate,
            status: quote.status === 'Completed' ? 'Draft' : 'Draft',
          }));
          setQuotes(mapped);
        }
      }
    } catch {
      // Keep sample data if storage parsing fails.
    }
  }, []);

  const totalQuotesCount = quotes.length;
  const totalVolume = quotes.reduce((sum, q) => sum + q.totalAmount, 0);
  const viewedQuotesCount = quotes.filter((q) => q.statusLabel === 'Viewed').length;
  const acceptedQuotesCount = quotes.filter((q) => q.statusLabel === 'Accepted').length;

  const filteredQuotes = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesSearch =
        !needle ||
        `${quote.title} ${quote.clientLabel} ${quote.quoteNumber} ${quote.statusLabel}`
          .toLowerCase()
          .includes(needle);
      const matchesStatus =
        statusFilter === 'All Status' || quote.statusLabel === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / rowsPerPage));
  const visibleQuotes = filteredQuotes.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handleDuplicate = (quote: DashboardQuote) => {
    const clone: DashboardQuote = {
      ...quote,
      id: `${quote.id}-copy-${Date.now()}`,
      quoteNumber: `${quote.quoteNumber}-C`,
      title: `${quote.title} Copy`,
      statusLabel: 'Draft',
      activityLabel: 'Created',
    };
    setQuotes((prev) => [clone, ...prev]);
    setCurrentPage(1);
  };

  const actionTiles = [
    {
      label: 'View',
      icon: Eye,
      tone: 'text-[#2457F0]',
      onClick: (quote: DashboardQuote) => navigate('/quotes'),
      ariaLabel: (quote: DashboardQuote) => `View ${quote.title}`,
    },
    {
      label: 'Share',
      icon: Link2,
      tone: 'text-[#22C55E]',
      onClick: async (quote: DashboardQuote) => {
        await navigator.clipboard.writeText(`${window.location.origin}/quotes/${quote.quoteNumber}`);
      },
      ariaLabel: (quote: DashboardQuote) => `Share ${quote.title}`,
    },
    {
      label: 'PDF',
      icon: Download,
      tone: 'text-[#EF4444]',
      onClick: (quote: DashboardQuote) => alert(`PDF export placeholder for ${quote.quoteNumber}`),
      ariaLabel: (quote: DashboardQuote) => `Download ${quote.title}`,
    },
    {
      label: 'Duplicate',
      icon: Copy,
      tone: 'text-[#7C3AED]',
      onClick: (quote: DashboardQuote) => handleDuplicate(quote),
      ariaLabel: (quote: DashboardQuote) => `Duplicate ${quote.title}`,
    },
  ] as const;

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-[#F8FAFC] p-4 md:p-6" id="dashboard-page-wrapper">
      <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-5 overflow-hidden">
        <div className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">
              Welcome back, Rahul <span className="inline-block">👋</span>
            </h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500">
              Create, manage and share your price quotes in one place.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start">
            <button
              type="button"
              onClick={() => setBellOpen((prev) => !prev)}
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
              aria-label="Notifications"
            >
              <Bell className="h-[19px] w-[19px]" />
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                3
              </span>
            </button>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF] text-[15px] font-semibold text-[#2457F0] shadow-sm"
              aria-label="User profile"
            >
              RS
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 text-[15px] font-medium text-slate-800"
            >
              Rahul Sharma
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {bellOpen && (
          <div className="absolute right-6 top-28 z-20 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">You have 3 unread notifications.</p>
            <button
              type="button"
              onClick={() => setBellOpen(false)}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Close
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total Quotes',
              value: totalQuotesCount.toString(),
              helper: 'All time quotes created',
              icon: FileText,
              wrap: 'bg-[#EEF2FF] text-[#2457F0]',
            },
            {
              label: 'Total Amount',
              value: `₹${totalVolume.toLocaleString('en-IN')}`,
              helper: 'Across all quotes',
              icon: Star,
              wrap: 'bg-[#E8FAEF] text-[#22C55E]',
            },
            {
              label: 'Viewed Quotes',
              value: viewedQuotesCount.toString(),
              helper: 'Quotes viewed by clients',
              icon: Eye,
              wrap: 'bg-[#FFF4E6] text-[#F59E0B]',
            },
            {
              label: 'Accepted Quotes',
              value: acceptedQuotesCount.toString().padStart(2, '0'),
              helper: 'Quotes accepted by clients',
              icon: Package,
              wrap: 'bg-[#F1EDFF] text-[#7C3AED]',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-[14px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-[56px] w-[56px] items-center justify-center rounded-[14px] ${stat.wrap}`}>
                    <Icon className="h-[28px] w-[28px] stroke-[1.9]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-700">{stat.label}</p>
                    <p className="mt-1 text-[34px] font-bold leading-none tracking-tight text-slate-900">
                      {stat.value}
                    </p>
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
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">My Quotes</h2>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex w-full items-center rounded-[12px] border border-slate-200 bg-white px-4 py-3 shadow-sm sm:w-[250px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search quotes..."
                    className="w-full border-none bg-transparent text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  <Search className="h-5 w-5 shrink-0 text-slate-700" />
                </div>

                <button
                  type="button"
                  onClick={() => setStatusFilter((prev) => quoteStatusOptions[(quoteStatusOptions.indexOf(prev) + 1) % quoteStatusOptions.length])}
                  className="inline-flex items-center justify-between gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-medium text-slate-700 shadow-sm sm:w-[200px]"
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
                    <th className="px-4 py-4 md:px-5 text-center min-w-[320px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="border-t border-slate-200/70 text-[14px]"
                    >
                      <td className="px-4 py-4 md:px-5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${quote.accent}`}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{quote.title}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{quote.quoteNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 md:px-5">
                        <div>
                          <p className="font-medium text-slate-900">{quote.clientLabel}</p>
                          <p className="mt-1 text-[12px] text-slate-500">{quote.clientDetails?.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 md:px-5 font-semibold text-slate-900">{quote.amountLabel}</td>
                      <td className="px-4 py-4 md:px-5">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${
                            quote.statusLabel === 'Accepted'
                              ? 'bg-[#E9FCEB] text-[#16A34A]'
                              : quote.statusLabel === 'Viewed'
                                ? 'bg-[#E8FAEF] text-[#16A34A]'
                                : quote.statusLabel === 'Sent'
                                  ? 'bg-[#F1EDFF] text-[#7C3AED]'
                                  : quote.statusLabel === 'Created'
                                    ? 'bg-[#EEF2FF] text-[#2457F0]'
                                    : 'bg-[#FFF4E6] text-[#F59E0B]'
                          }`}
                        >
                          {quote.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-5">
                        <p className="font-medium text-slate-700">{quote.createdLabel}</p>
                        <p className="mt-1 text-[12px] text-slate-500">{quote.activityTime}</p>
                      </td>
      <td className="px-4 py-4 md:px-5">
        <div className="grid grid-cols-4 items-start justify-items-center gap-3 whitespace-nowrap">
          {actionTiles.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.label} className="flex flex-col items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => action.onClick(quote)}
                  className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)] active:translate-y-0"
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
                Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredQuotes.length)} to{' '}
                {Math.min(currentPage * rowsPerPage, filteredQuotes.length)} of {filteredQuotes.length} quotes
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-50"
                    aria-label="Previous page"
                  >
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
                        className={`flex h-10 w-10 items-center justify-center rounded-[10px] border text-sm font-semibold ${
                          isActive
                            ? 'border-[#2457F0] bg-[#F4F7FF] text-[#2457F0]'
                            : 'border-transparent text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-50"
                    aria-label="Next page"
                  >
                    <span className="text-[18px] leading-none">{'>'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[14px] font-medium text-slate-600">
                  <span>Rows per page</span>
                  <button
                    type="button"
                    onClick={() => setRowsPerPage((prev) => (prev === 5 ? 10 : prev === 10 ? 25 : 5))}
                    className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm"
                  >
                    {rowsPerPage}
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5 xl:max-h-full xl:overflow-hidden">
            <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Share Your Quotes Faster</h3>
              <p className="mt-3 text-[14px] leading-6 text-slate-500">
                Share quotes using unique links. Your client can view quote online.
              </p>
              <div className="mt-6 flex items-center justify-center">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-3xl bg-[#F8FAFC]">
                  <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2457F0] text-white shadow-lg">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div className="h-20 w-24 rounded-2xl bg-white shadow-sm" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/help-support`)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold text-[#2457F0]"
              >
                <ArrowRight className="h-4.5 w-4.5" />
                Learn How It Works
              </button>
            </div>

            <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Recent Activity</h3>
              <div className="mt-4 space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.title} className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activity.iconWrap}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-900">{activity.title}</p>
                        <p className="mt-1 text-[13px] leading-5 text-slate-600">{activity.subtitle}</p>
                        <p className="mt-1 text-[12px] text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => navigate('/quotes')}
                className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-[#2457F0]"
              >
                View all activity
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </aside>
        </section>

        <div className="rounded-[14px] border border-slate-200 bg-[#EEF3FF] px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#2457F0] shadow-sm">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-slate-900">Create quotes in seconds</h3>
                <p className="mt-1 text-[14px] text-slate-600">
                  Use templates, save time and send professional quotes that win more clients.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/create-quote')}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#2457F0] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_10px_18px_rgba(36,87,240,0.16)]"
            >
              <Plus className="h-[18px] w-[18px]" />
              Create New Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
