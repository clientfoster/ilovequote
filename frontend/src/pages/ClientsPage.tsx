import React from 'react';
import { FileText, Search, Star, Users, UserRound } from 'lucide-react';

const stats = [
  { label: 'Total Clients', value: '32', helper: 'All time clients', icon: UserRound, wrap: 'bg-[#EEF2FF] text-[#2F55FF]' },
  { label: 'Clients with Quotes', value: '28', helper: 'Have at least one quote', icon: FileText, wrap: 'bg-emerald-50 text-emerald-600' },
  { label: 'Quotes Sent', value: '18', helper: 'Total quotes sent', icon: Star, wrap: 'bg-orange-50 text-orange-500' },
  { label: 'Active Clients', value: '25', helper: 'Active this month', icon: Users, wrap: 'bg-violet-50 text-violet-600' },
];

const clients = [
  ['Dr. Swanish', 'Swanish Healthcare Pvt. Ltd.', 'info@swanishhealthcare.com', '+91 98462 68462', '3', '16 May 2024'],
  ['John Smith', 'Bright Future Pvt Ltd', 'john@brightfuture.com', '+91 98765 43210', '2', '14 May 2024'],
  ['Amit Verma', 'ABC Company', 'amit@abccompany.com', '+91 91234 56789', '1', '12 May 2024'],
  ['Neha Kapoor', 'Fashion World', 'neha@fashionworld.com', '+91 99887 77665', '4', '09 May 2024'],
  ['Ravi Kumar', 'TechNova Inc.', 'ravi@technova.com', '+91 87654 32109', '5', '07 May 2024'],
  ['Priya Nair', 'GreenLeaf Cafe', 'priya@greenleafcafe.com', '+91 81234 00011', '1', '06 May 2024'],
];

export default function ClientsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-2 text-[15px] text-slate-500">
            Manage all your clients in one place and use them while creating quotes.
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
                {clients.map((client) => (
                  <tr key={`${client[0]}-${client[2]}`} className="border-t border-slate-200/70 text-[14px]">
                    <td className="px-5 py-4 font-semibold text-slate-900">{client[0]}</td>
                    <td className="px-5 py-4 text-slate-700">{client[1]}</td>
                    <td className="px-5 py-4 text-slate-700">{client[2]}</td>
                    <td className="px-5 py-4 text-slate-700">{client[3]}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-[10px] bg-[#EEF3FF] px-2 text-sm font-semibold text-[#2457F0]">
                        {client[4]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{client[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
