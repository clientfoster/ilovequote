import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search, Star, UserRound, Users } from 'lucide-react';
import { fetchUserQuotes } from '../quoteApi';
import { Quote } from '../types';

type ClientRow = {
  name: string;
  company: string;
  email: string;
  phone: string;
  quotes: number;
  lastActivity: string;
};

function toClientRows(quotes: Quote[]) {
  const map = new Map<string, ClientRow>();
  quotes.forEach((quote) => {
    const name = quote.clientDetails?.name || 'Client';
    const email = quote.clientDetails?.email || '';
    const key = `${name}-${email}`;
    const current = map.get(key);
    const next: ClientRow = {
      name,
      company: quote.businessDetails?.companyName || 'Business',
      email,
      phone: quote.clientDetails?.phone || '',
      quotes: (current?.quotes || 0) + 1,
      lastActivity: quote.date,
    };
    map.set(key, next);
  });
  return Array.from(map.values());
}

export default function ClientsPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchUserQuotes().then(setQuotes).catch(() => setQuotes([]));
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return toClientRows(quotes).filter((row) =>
      !needle || `${row.name} ${row.company} ${row.email} ${row.phone}`.toLowerCase().includes(needle),
    );
  }, [quotes, query]);

  const stats = [
    { label: 'Total Clients', value: String(rows.length), helper: 'Unique clients in your account', icon: UserRound, wrap: 'bg-[#EEF2FF] text-[#2F55FF]' },
    { label: 'Clients with Quotes', value: String(rows.filter((row) => row.quotes > 0).length), helper: 'Have at least one quote', icon: FileText, wrap: 'bg-emerald-50 text-emerald-600' },
    { label: 'Quotes Sent', value: String(quotes.length), helper: 'Saved quote count', icon: Star, wrap: 'bg-orange-50 text-orange-500' },
    { label: 'Active Clients', value: String(rows.filter((row) => row.lastActivity).length), helper: 'Clients with recent activity', icon: Users, wrap: 'bg-violet-50 text-violet-600' },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-2 text-[15px] text-slate-500">
            These clients are pulled from your saved quotes, so every account stays isolated.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-[14px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`flex h-[56px] w-[56px] items-center justify-center rounded-[14px] ${stat.wrap}`}>
                    <Icon className="h-[28px] w-[28px]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-700">{stat.label}</p>
                    <p className="mt-1 text-[34px] font-bold leading-none tracking-tight text-slate-900">{stat.value}</p>
                    <p className="mt-2 text-[12px] font-medium text-slate-500">{stat.helper}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[14px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">All Clients</h2>
            <div className="flex items-center rounded-[12px] border border-slate-200 bg-white px-4 py-3 shadow-sm md:w-[420px]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients by name, email or company..."
                className="w-full border-none bg-transparent text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              <Search className="h-5 w-5 shrink-0 text-slate-700" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left">
              <thead className="bg-[#FBFCFF]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                  <th className="px-5 py-4">Client Name</th>
                  <th className="px-5 py-4">Company</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Quotes</th>
                  <th className="px-5 py-4">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      No clients found yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((client) => (
                    <tr key={`${client.name}-${client.email}`} className="border-t border-slate-200/70 text-[14px]">
                      <td className="px-5 py-4 font-semibold text-slate-900">{client.name}</td>
                      <td className="px-5 py-4 text-slate-700">{client.company}</td>
                      <td className="px-5 py-4 text-slate-700">{client.email}</td>
                      <td className="px-5 py-4 text-slate-700">{client.phone}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-[10px] bg-[#EEF3FF] px-2 text-sm font-semibold text-[#2457F0]">
                          {client.quotes}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{client.lastActivity}</td>
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
