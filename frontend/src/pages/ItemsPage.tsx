import React from 'react';
import {
  Bell,
  ChevronDown,
  Crown,
  Edit3,
  FileText,
  Filter,
  HelpCircle,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Tag,
  Trash2,
  UserRound,
  Users,
  Box,
  Globe,
  LayoutGrid,
  Link2,
  Smartphone,
  CircleOff,
} from 'lucide-react';

const stats = [
  { label: 'Total Items', value: '36', helper: 'All items added', icon: Package, tone: 'bg-[#EEF2FF] text-[#2457F0]' },
  { label: 'Active Items', value: '32', helper: 'Items available to use', icon: Tag, tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { label: 'Services', value: '24', helper: 'Service type items', icon: LayoutGrid, tone: 'bg-[#F1EDFF] text-[#7C3AED]' },
  { label: 'Products', value: '12', helper: 'Product type items', icon: Box, tone: 'bg-[#FFF0E1] text-[#F97316]' },
] as const;

const rows = [
  { name: 'Website Design', desc: 'Responsive website design', type: 'Service', category: 'Web Development', unit: 'Nos', price: '25,000.00', tax: '18% GST', status: 'Active', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { name: 'Domain & Hosting (1 Year)', desc: '.com domain with hosting', type: 'Service', category: 'Hosting', unit: 'Year', price: '2,500.00', tax: '18% GST', status: 'Active', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { name: 'SEO Setup', desc: 'Basic on-page SEO setup', type: 'Service', category: 'Digital Marketing', unit: 'Nos', price: '8,000.00', tax: '18% GST', status: 'Active', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { name: 'Mobile App Development', desc: 'Android & iOS app development', type: 'Service', category: 'App Development', unit: 'Nos', price: '1,25,000.00', tax: '18% GST', status: 'Active', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { name: 'Logo Design', desc: 'Professional logo design', type: 'Service', category: 'Design', unit: 'Nos', price: '4,000.00', tax: '18% GST', status: 'Active', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { name: 'Business Card Design', desc: 'Double sided business card', type: 'Service', category: 'Design', unit: 'Nos', price: '1,500.00', tax: '18% GST', status: 'Inactive', tone: 'bg-[#F3F4F6] text-[#475569]' },
  { name: 'SSL Certificate', desc: 'SSL for secure connection', type: 'Product', category: 'Security', unit: 'Nos', price: '1,200.00', tax: '18% GST', status: 'Active', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
  { name: 'Professional Email', desc: 'Business email account', type: 'Product', category: 'Email', unit: 'Month', price: '299.00', tax: '18% GST', status: 'Active', tone: 'bg-[#E9FCEB] text-[#16A34A]' },
] as const;

export default function ItemsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">Items / Products</h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500">
              Create and manage all your products or services that you can add in quotes.
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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <button type="button" className="border-b-2 border-[#2457F0] pb-3 text-[15px] font-semibold text-[#2457F0]">All Items</button>
              <button type="button" className="pb-3 text-[15px] font-semibold text-slate-500">Services</button>
              <button type="button" className="pb-3 text-[15px] font-semibold text-slate-500">Products</button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-11 w-[340px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search className="h-5 w-5 shrink-0 text-slate-800" />
                <input
                  type="text"
                  defaultValue=""
                  placeholder="Search items by name or description..."
                  className="w-full border-none bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <button type="button" className="inline-flex h-11 min-w-[150px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 shadow-sm">
                <span>All Categories</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2457F0] px-5 text-[14px] font-semibold text-white shadow-lg shadow-blue-100">
                <Plus className="h-4 w-4" />
                Add New Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1220px] w-full border-collapse text-left">
              <thead className="bg-[#FBFCFF]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                  <th className="px-4 py-4 md:px-5">Item Name</th>
                  <th className="px-4 py-4 md:px-5">Type</th>
                  <th className="px-4 py-4 md:px-5">Category</th>
                  <th className="px-4 py-4 md:px-5">Unit</th>
                  <th className="px-4 py-4 md:px-5">Price (₹)</th>
                  <th className="px-4 py-4 md:px-5">Tax</th>
                  <th className="px-4 py-4 md:px-5">Status</th>
                  <th className="px-4 py-4 md:px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name} className="border-t border-slate-200/70 text-[14px]">
                    <td className="px-4 py-5 md:px-5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${row.status === 'Active' ? 'bg-[#EEF2FF] text-[#2457F0]' : 'bg-[#FFF4E6] text-[#F59E0B]'}`}>
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{row.name}</p>
                          <p className="mt-1 text-[12px] text-slate-500">{row.desc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 md:px-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${row.type === 'Service' ? 'bg-[#EEF2FF] text-[#2457F0]' : 'bg-[#E9FCEB] text-[#16A34A]'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-5 md:px-5 text-slate-800">{row.category}</td>
                    <td className="px-4 py-5 md:px-5 text-slate-800">{row.unit}</td>
                    <td className="px-4 py-5 md:px-5 font-semibold text-slate-900">{row.price}</td>
                    <td className="px-4 py-5 md:px-5 text-slate-700">{row.tax}</td>
                    <td className="px-4 py-5 md:px-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${row.tone}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 md:px-5">
                      <div className="flex items-center justify-center gap-3">
                        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                          <Edit3 className="h-4.5 w-4.5 text-slate-700" />
                        </button>
                        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                          <Trash2 className="h-4.5 w-4.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-[14px] font-medium text-slate-600">Showing 1 to 8 of 36 items</p>
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
        </section>
      </div>
    </div>
  );
}
