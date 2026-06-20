import React from 'react';
import {
  Calendar,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Link2,
  MoreVertical,
  PencilLine,
  PieChart,
  Search,
  TrendingUp,
  Users,
  Crown,
  Bell,
  BarChart3,
} from 'lucide-react';

const stats = [
  { label: 'Total Quotes', value: '52', helper: 'All time quotes', icon: FileText, tone: 'bg-[#EEF2FF] text-[#2457F0]' },
  { label: 'Total Revenue', value: '₹12,45,800', helper: 'Across all quotes', icon: TrendingUp, tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { label: 'Total Clients', value: '32', helper: 'All time clients', icon: Users, tone: 'bg-[#F1EDFF] text-[#7C3AED]' },
  { label: 'Conversion Rate', value: '38%', helper: 'Quotes accepted', icon: PieChart, tone: 'bg-[#FFF0E1] text-[#F97316]' },
] as const;

const rows = [
  { name: 'Website Development Package 2026', quote: 'Q-2026-001', client: 'Swanish Healthcare', contact: 'Dr. Swanish', amount: '₹35,500', status: 'Accepted', date: '16 May 2024', time: '10:30 AM', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { name: 'SEO Marketing Services', quote: 'Q-2026-002', client: 'Bright Future Pvt Ltd', contact: 'John Smith', amount: '₹22,000', status: 'Viewed', date: '14 May 2024', time: '03:15 PM', tone: 'bg-[#E8FAEF] text-[#16A34A]' },
  { name: 'Logo Design & Branding', quote: 'Q-2026-003', client: 'ABC Company', contact: 'Amit Verma', amount: '₹12,500', status: 'Sent', date: '12 May 2024', time: '11:20 AM', tone: 'bg-[#F1EDFF] text-[#7C3AED]' },
  { name: 'E-commerce Website', quote: 'Q-2026-004', client: 'Fashion World', contact: 'Neha Kapoor', amount: '₹75,000', status: 'Draft', date: '09 May 2024', time: '05:45 PM', tone: 'bg-[#F3F4F6] text-[#475569]' },
  { name: 'Mobile App Development', quote: 'Q-2026-005', client: 'TechNova Inc.', contact: 'Ravi Kumar', amount: '₹1,25,000', status: 'Draft', date: '07 May 2024', time: '09:10 AM', tone: 'bg-[#F3F4F6] text-[#475569]' },
  { name: 'Social Media Marketing', quote: 'Q-2026-006', client: 'GreenLeaf Cafe', contact: 'Priya Nair', amount: '₹18,000', status: 'Accepted', date: '06 May 2024', time: '02:35 PM', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { name: 'Corporate Identity Package', quote: 'Q-2026-007', client: 'Digital Minds Agency', contact: 'Vikram Mehta', amount: '₹28,500', status: 'Expired', date: '01 May 2024', time: '12:00 PM', tone: 'bg-[#FFF4E6] text-[#F59E0B]' },
] as const;

const statusBreakdown = [
  { label: 'Draft', count: '8', pct: '15%', color: 'bg-slate-300' },
  { label: 'Sent', count: '12', pct: '23%', color: 'bg-[#7C3AED]' },
  { label: 'Viewed', count: '10', pct: '19%', color: 'bg-[#2457F0]' },
  { label: 'Accepted', count: '15', pct: '29%', color: 'bg-[#22C55E]' },
  { label: 'Expired', count: '7', pct: '14%', color: 'bg-[#F87171]' },
] as const;

const clients = [
  { name: 'Swanish Healthcare', amount: '₹1,25,500' },
  { name: 'Bright Future Pvt Ltd', amount: '₹98,000' },
  { name: 'Fashion World', amount: '₹75,000' },
  { name: 'TechNova Inc.', amount: '₹62,500' },
  { name: 'Digital Minds Agency', amount: '₹45,300' },
] as const;

export default function PortfolioPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">My Portfolio</h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500">
              Track your business with insightful overview of your quotes and clients.
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
                <button type="button" className="pb-3 text-[15px] font-semibold text-slate-500">Client Overview</button>
                <button type="button" className="pb-3 text-[15px] font-semibold text-slate-500">Revenue Overview</button>
              </div>
              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm">
                <Calendar className="h-4 w-4 text-slate-600" />
                01 May 2024 - 31 May 2024
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
                {rows.map((row) => (
                    <tr key={row.quote} className="border-t border-slate-200/70 text-[14px]">
                      <td className="px-4 py-5 md:px-5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${row.status === 'Accepted' ? 'bg-[#E9FCEB] text-[#16A34A]' : row.status === 'Viewed' ? 'bg-[#EEF2FF] text-[#2457F0]' : row.status === 'Sent' ? 'bg-[#F1EDFF] text-[#7C3AED]' : row.status === 'Expired' ? 'bg-[#FFF4E6] text-[#F59E0B]' : 'bg-[#EDE7FF] text-[#7C3AED]'}`}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{row.name}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{row.quote}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 md:px-5">
                        <div>
                          <p className="font-medium text-slate-900">{row.client}</p>
                          <p className="mt-1 text-[12px] text-slate-500">{row.contact}</p>
                        </div>
                      </td>
                      <td className="px-4 py-5 md:px-5 font-semibold text-slate-900">{row.amount}</td>
                      <td className="px-4 py-5 md:px-5">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${row.tone}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-5 md:px-5">
                        <p className="font-medium text-slate-700">{row.date}</p>
                        <p className="mt-1 text-[12px] text-slate-500">{row.time}</p>
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
                            <MoreVertical className="h-4.5 w-4.5 text-slate-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-[14px] font-medium text-slate-600">Showing 1 to 7 of 52 quotes</p>
              <div className="flex items-center gap-2">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50">
                  <span className="text-[18px] leading-none">{'<'}</span>
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#2457F0] bg-[#F4F7FF] text-sm font-semibold text-[#2457F0]">
                  1
                </button>
                {[2, 3, 4, 5].map((page) => (
                  <button key={page} type="button" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-transparent text-sm font-semibold text-slate-700 hover:bg-slate-50">
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
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">Revenue Summary</h3>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm">
                  This Month
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <p className="mt-4 text-[28px] font-bold tracking-[-0.03em] text-slate-900">₹2,45,300</p>
              <p className="mt-2 text-[14px] font-medium text-[#16A34A]">+12.5% <span className="text-slate-500">from last month</span></p>

              <div className="mt-4 h-[180px] rounded-xl border border-slate-100 bg-[#FBFCFF] px-4 py-4">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-end justify-between gap-2">
                    {[16, 34, 52, 44, 38, 61, 82, 78, 96, 88, 74, 98].map((height, index) => (
                      <div key={index} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-full bg-[#2457F0]/15" style={{ height: 120 }}>
                          <div
                            className="w-full rounded-full bg-[#2457F0]"
                            style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>1 May</span>
                    <span>10 May</span>
                    <span>20 May</span>
                    <span>31 May</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">Quotes by Status</h3>
              <div className="mt-4 flex items-center gap-6">
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[conic-gradient(#F87171_0%_14%,#7C3AED_14%_37%,#2457F0_37%_56%,#22C55E_56%_85%,#CBD5E1_85%_100%)]" />
                  <div className="absolute inset-8 rounded-full bg-white" />
                </div>
                <div className="space-y-3 text-[13px] font-medium text-slate-700">
                  {statusBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                        {item.label}
                      </span>
                      <span className="font-semibold text-slate-900">{item.count} ({item.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">Top Clients</h3>
              <div className="mt-4 space-y-4 text-[13px]">
                {clients.map((client) => (
                  <div key={client.name} className="flex items-center justify-between gap-3">
                    <span className="text-slate-700">{client.name}</span>
                    <span className="font-semibold text-slate-900">{client.amount}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-[#2457F0] shadow-sm">
                View All Clients
              </button>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
