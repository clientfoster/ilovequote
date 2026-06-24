import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Edit3, Package, Plus, Search, ShoppingBag, Trash2, Tag } from 'lucide-react';
import { getDisplayAuthUser } from '../auth';
import { fetchUserQuotes } from '../quoteApi';
import { Quote, QuoteItem } from '../types';
import { useNavigate } from 'react-router-dom';

type ItemRow = QuoteItem & {
  sourceQuote: string;
  businessName: string;
};

function toItemRows(quotes: Quote[]) {
  const rows: ItemRow[] = [];
  quotes.forEach((quote) => {
    quote.items.forEach((item) => {
      rows.push({
        ...item,
        sourceQuote: quote.quoteNumber,
        businessName: quote.businessDetails?.companyName || 'Business',
      });
    });
  });
  return rows;
}

export default function ItemsPage() {
  const navigate = useNavigate();
  const { displayName, initials } = getDisplayAuthUser();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchUserQuotes().then(setQuotes).catch(() => setQuotes([]));
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return toItemRows(quotes).filter((row) => !needle || `${row.name} ${row.description} ${row.sourceQuote}`.toLowerCase().includes(needle));
  }, [quotes, query]);

  const stats = [
    { label: 'Total Items', value: String(rows.length), helper: 'Items used in your quotes', icon: Package, tone: 'bg-[#EEF2FF] text-[#2457F0]' },
    { label: 'Active Items', value: String(rows.filter((row) => !row.complimentary).length), helper: 'Billable items', icon: Tag, tone: 'bg-[#E9FCEB] text-[#16A34A]' },
    { label: 'Services', value: String(rows.filter((row) => row.unit !== 'Nos').length), helper: 'Service-style items', icon: ShoppingBag, tone: 'bg-[#F1EDFF] text-[#7C3AED]' },
    { label: 'Products', value: String(rows.filter((row) => row.unit === 'Nos').length), helper: 'Product-style items', icon: Package, tone: 'bg-[#FFF0E1] text-[#F97316]' },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">Items / Products</h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500">
              Items are pulled from your saved quotes. Nothing is shared across users.
            </p>
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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <button type="button" className="border-b-2 border-[#2457F0] pb-3 text-[15px] font-semibold text-[#2457F0]">All Items</button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-11 w-[340px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search className="h-5 w-5 shrink-0 text-slate-800" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items by name or description..."
                  className="w-full border-none bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2457F0] px-5 text-[14px] font-semibold text-white shadow-lg shadow-blue-100" onClick={() => navigate('/create-quote')}>
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
                  <th className="px-4 py-4 md:px-5">Quote</th>
                  <th className="px-4 py-4 md:px-5">Type</th>
                  <th className="px-4 py-4 md:px-5">Unit</th>
                  <th className="px-4 py-4 md:px-5">Price</th>
                  <th className="px-4 py-4 md:px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      No items found yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={`${row.sourceQuote}-${row.id}`} className="border-t border-slate-200/70 text-[14px]">
                      <td className="px-4 py-5 md:px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2457F0]">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{row.name}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{row.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 md:px-5 text-slate-700">{row.sourceQuote}</td>
                      <td className="px-4 py-5 md:px-5 text-slate-800">{row.complimentary ? 'Complimentary' : 'Billable'}</td>
                      <td className="px-4 py-5 md:px-5 text-slate-800">{row.unit}</td>
                      <td className="px-4 py-5 md:px-5 font-semibold text-slate-900">{row.price.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-5 md:px-5">
                        <div className="flex items-center justify-center gap-3">
                          <button type="button" onClick={() => navigate('/create-quote')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                            <Edit3 className="h-4.5 w-4.5 text-slate-700" />
                          </button>
                          <button type="button" onClick={() => navigate('/create-quote')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                            <Trash2 className="h-4.5 w-4.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
