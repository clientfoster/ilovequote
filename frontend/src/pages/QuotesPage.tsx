import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Copy,
  Crown,
  Download,
  Eye,
  Filter,
  FileText,
  Grid2x2,
  Link2,
  List,
  MoreVertical,
  PencilLine,
  Search,
  Trash2,
} from 'lucide-react';

const statusTabs = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Expired'] as const;

const rows = [
  {
    quoteNumber: 'Q-2026-001',
    title: 'Website Development Package 2026',
    clientName: 'Dr. Swanish',
    businessName: 'Swanish Healthcare',
    amount: '₹35,500',
    createdOn: '16 May 2024',
    createdTime: '10:30 AM',
    status: 'Created',
    shareLink: 'ilovequote.com/q/swanish-healthcare-q2026001',
    accent: 'bg-[#EEF2FF] text-[#2457F0]',
  },
  {
    quoteNumber: 'Q-2026-002',
    title: 'SEO Marketing Services',
    clientName: 'John Smith',
    businessName: 'Bright Future Pvt Ltd',
    amount: '₹22,000',
    createdOn: '14 May 2024',
    createdTime: '03:15 PM',
    status: 'Viewed',
    shareLink: 'ilovequote.com/q/bright-future-q2026002',
    accent: 'bg-[#E9FCEB] text-[#22C55E]',
  },
  {
    quoteNumber: 'Q-2026-003',
    title: 'Logo Design & Branding',
    clientName: 'Amit Verma',
    businessName: 'ABC Company',
    amount: '₹12,500',
    createdOn: '12 May 2024',
    createdTime: '11:20 AM',
    status: 'Sent',
    shareLink: 'ilovequote.com/q/abc-company-q2026003',
    accent: 'bg-[#FFF0E1] text-[#F97316]',
  },
  {
    quoteNumber: 'Q-2026-004',
    title: 'E-commerce Website',
    clientName: 'Neha Kapoor',
    businessName: 'Fashion World',
    amount: '₹75,000',
    createdOn: '09 May 2024',
    createdTime: '05:45 PM',
    status: 'Accepted',
    shareLink: 'ilovequote.com/q/fashion-world-q2026004',
    accent: 'bg-[#FFF0F0] text-[#F43F5E]',
  },
  {
    quoteNumber: 'Q-2026-005',
    title: 'Mobile App Development',
    clientName: 'Ravi Kumar',
    businessName: 'TechNova Inc.',
    amount: '₹1,25,000',
    createdOn: '07 May 2024',
    createdTime: '09:10 AM',
    status: 'Draft',
    shareLink: 'ilovequote.com/q/technova-q2026005',
    accent: 'bg-[#EDE7FF] text-[#7C3AED]',
  },
  {
    quoteNumber: 'Q-2026-006',
    title: 'Social Media Marketing',
    clientName: 'Priya Nair',
    businessName: 'GreenLeaf Cafe',
    amount: '₹18,000',
    createdOn: '06 May 2024',
    createdTime: '02:35 PM',
    status: 'Viewed',
    shareLink: 'ilovequote.com/q/greenleaf-cafe-q2026006',
    accent: 'bg-[#E9FCEB] text-[#22C55E]',
  },
] as const;

const statusStyles: Record<string, string> = {
  Created: 'bg-[#EEF2FF] text-[#2457F0]',
  Viewed: 'bg-[#E8FAEF] text-[#16A34A]',
  Sent: 'bg-[#F1EDFF] text-[#7C3AED]',
  Accepted: 'bg-[#E9FCEB] text-[#16A34A]',
  Draft: 'bg-[#F3F4F6] text-[#475569]',
  Expired: 'bg-[#FFF4E6] text-[#F59E0B]',
};

export default function QuotesPage() {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">My Quotes</h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500">
              Manage, share and download all your price quotes in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-700 shadow-sm">
              <Crown className="h-4 w-4 text-[#F5A524]" />
              Upgrade to Pro
            </button>
            <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                3
              </span>
            </button>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2457F0] text-[13px] font-semibold text-white shadow-sm">
              RS
            </button>
            <button type="button" className="flex items-center gap-2 text-[14px] font-medium text-slate-800">
              Rahul Sharma
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              <button type="button" className="whitespace-nowrap border-b-2 border-[#2457F0] px-1 pb-3 text-[15px] font-semibold text-[#2457F0]">
                All Quotes
              </button>
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className="whitespace-nowrap border-b-2 border-transparent px-1 pb-3 text-[15px] font-semibold text-slate-500"
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-11 w-[290px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search className="h-5 w-5 shrink-0 text-slate-800" />
                <input
                  type="text"
                  defaultValue=""
                  placeholder="Search quotes by name or client..."
                  className="w-full border-none bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <button type="button" className="inline-flex h-11 min-w-[175px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 shadow-sm">
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-4.5 w-4.5 text-slate-700" />
                  All Status
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
                {rows.map((row, index) => (
                  <tr key={row.quoteNumber} className="border-t border-slate-200/70 text-[14px]">
                    <td className="px-4 py-5 md:px-5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${row.accent}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{row.title}</p>
                          <p className="mt-1 text-[12px] text-slate-500">{row.quoteNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 md:px-5">
                      <div>
                        <p className="font-medium text-slate-900">{row.businessName}</p>
                        <p className="mt-1 text-[12px] text-slate-500">{row.clientName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-5 md:px-5 font-semibold text-slate-900">{row.amount}</td>
                    <td className="px-4 py-5 md:px-5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${statusStyles[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 md:px-5">
                      <p className="font-medium text-slate-700">{row.createdOn}</p>
                      <p className="mt-1 text-[12px] text-slate-500">{row.createdTime}</p>
                    </td>
                    <td className="px-4 py-5 md:px-5">
                      <div className="flex flex-col items-start gap-1.5">
                        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
                          <Link2 className="h-4.5 w-4.5" />
                        </button>
                        <p className="max-w-[180px] break-all text-[13px] leading-5 text-slate-500">{row.shareLink}</p>
                        <button type="button" className="text-[13px] font-semibold text-[#2457F0]">
                          Copy
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-5 md:px-5">
                        <div className="flex items-center justify-center gap-3">
                        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                          <Eye className="h-4.5 w-4.5 text-[#2457F0]" />
                        </button>
                        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                          <Link2 className="h-4.5 w-4.5 text-[#22C55E]" />
                        </button>
                        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                          <Download className="h-4.5 w-4.5 text-[#EF4444]" />
                        </button>
                        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                          <Copy className="h-4.5 w-4.5 text-[#7C3AED]" />
                        </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuIndex(openMenuIndex === index ? null : index);
                              }}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
                            >
                              <MoreVertical className="h-4.5 w-4.5 text-slate-700" />
                            </button>
                            {openMenuIndex === index && (
                            <div className="absolute right-0 top-12 z-20 w-36 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                              <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                                <PencilLine className="h-4 w-4" />
                                Rename
                              </button>
                              <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </button>
                              <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                            )}
                          </div>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-[14px] font-medium text-slate-600">Showing 1 to 6 of 25 quotes</p>

            <div className="flex items-center gap-2">
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50">
                <span className="text-[18px] leading-none">{'<'}</span>
              </button>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#2457F0] bg-[#F4F7FF] text-sm font-semibold text-[#2457F0]">
                1
              </button>
              {[2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-transparent text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {page}
                </button>
              ))}
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50">
                <span className="text-[18px] leading-none">{'>'}</span>
              </button>

              <div className="ml-4 flex items-center gap-3 text-[14px] font-medium text-slate-600">
                <span>Rows per page</span>
                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm">
                  10
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-[14px] border border-slate-200 bg-[#EEF3FF] px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {[
              { label: 'Viewed', text: 'Client has viewed the quote', color: 'text-[#2457F0]' },
              { label: 'Sent', text: 'Quote has been sent to client', color: 'text-[#7C3AED]' },
              { label: 'Accepted', text: 'Client has accepted the quote', color: 'text-[#16A34A]' },
              { label: 'Expired', text: 'Quote has expired', color: 'text-slate-700' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl px-2 py-1">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white ${item.color}`}>
                  <Eye className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-900">{item.label}</p>
                  <p className="text-[12px] text-slate-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
