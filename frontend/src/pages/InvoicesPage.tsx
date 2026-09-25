import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Grid2x2,
  List,
  Plus,
  PlusCircle,
  Receipt,
  Search,
  Trash2,
} from 'lucide-react';
import { getDisplayAuthUser } from '../auth';
import { defaultInvoiceDraft, InvoiceDraft } from '../invoiceDraft';

export type SavedInvoice = {
  id: string;
  invoiceNumber: string;
  businessName: string;
  clientName: string;
  billedToCompany?: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid';
  invoiceDate: string;
  dueDate: string;
  currency: string;
};

const INVOICES_STORAGE_KEY = 'ilovequote_saved_invoices_v1';
const DRAFT_STORAGE_KEY = 'ilovequote_invoice_draft_v1';

const statusTabs = ['All', 'Draft', 'Sent', 'Paid'] as const;

function formatMoney(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { displayName, initials } = getDisplayAuthUser();
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof statusTabs)[number]>('All');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
      let list: SavedInvoice[] = stored ? JSON.parse(stored) : [];

      // Also check if there is an active draft invoice in localStorage
      const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftRaw) {
        const draft: InvoiceDraft = JSON.parse(draftRaw);
        if (draft.invoiceNumber && !list.some((inv) => inv.invoiceNumber === draft.invoiceNumber)) {
          const subtotal = (draft.lineItems || []).reduce((sum, item) => sum + (item.quantity * item.rate), 0);
          list.unshift({
            id: 'draft-current',
            invoiceNumber: draft.invoiceNumber || 'INV00234',
            businessName: draft.businessName || 'My Business',
            clientName: draft.clientName || draft.billedToCompany || 'Client',
            billedToCompany: draft.billedToCompany,
            amount: subtotal,
            status: 'Draft',
            invoiceDate: draft.invoiceDate || new Date().toISOString().split('T')[0],
            dueDate: draft.dueDate || '',
            currency: 'INR',
          });
        }
      }

      setInvoices(list);
    } catch {
      setInvoices([]);
    }
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch =
        !needle ||
        `${inv.invoiceNumber} ${inv.businessName} ${inv.clientName} ${inv.billedToCompany || ''}`
          .toLowerCase()
          .includes(needle);
      return matchesSearch && (status === 'All' || status === inv.status);
    });
  }, [invoices, query, status]);

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this invoice?')) return;
    const updated = invoices.filter((inv) => inv.id !== id);
    setInvoices(updated);
    try {
      localStorage.setItem(
        INVOICES_STORAGE_KEY,
        JSON.stringify(updated.filter((inv) => inv.id !== 'draft-current'))
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1450px] space-y-5">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">My Invoices</h1>
            <p className="mt-1 text-[15px] font-medium text-slate-500">
              {displayName} can manage, track and download generated invoices here.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/create-invoice')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2457F0] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
              id="btn-new-invoice"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Invoice
            </button>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2457F0] text-[13px] font-semibold text-white shadow-sm">
              {initials}
            </button>
          </div>
        </div>

        {/* Filters & Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 overflow-x-auto">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatus(tab)}
                  className={`whitespace-nowrap border-b-2 px-1 pb-3 text-[15px] font-semibold transition-colors cursor-pointer ${
                    status === tab ? 'border-[#2457F0] text-[#2457F0]' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'All' ? 'All Invoices' : tab}
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
                  placeholder="Search invoices by number or client..."
                  className="w-full border-none bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2457F0] text-white" aria-label="List view">
                  <List className="h-4.5 w-4.5" />
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50" aria-label="Grid view">
                  <Grid2x2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Invoices Card List (< md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Receipt className="w-8 h-8 text-blue-600 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No invoices found</p>
                <button
                  type="button"
                  onClick={() => navigate('/create-invoice')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2457F0] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> New Invoice
                </button>
              </div>
            ) : (
              filtered.map((inv) => (
                <div key={inv.id} className="p-4 space-y-2.5 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2457F0]">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{inv.invoiceNumber}</span>
                        <p className="text-[11px] text-slate-400">{inv.businessName}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-600'
                          : inv.status === 'Sent'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{inv.clientName}</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">{formatMoney(inv.amount)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Date: {inv.invoiceDate}</span>
                    <span>Due: {inv.dueDate || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/create-invoice/design')}
                      className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2457F0] font-semibold text-xs text-center transition-colors"
                    >
                      View / Export
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteInvoice(inv.id)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse text-left">
              <thead className="bg-[#FBFCFF]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                  <th className="px-4 py-4 md:px-5">Invoice #</th>
                  <th className="px-4 py-4 md:px-5">Client / Company</th>
                  <th className="px-4 py-4 md:px-5">Amount</th>
                  <th className="px-4 py-4 md:px-5">Status</th>
                  <th className="px-4 py-4 md:px-5">Invoice Date</th>
                  <th className="px-4 py-4 md:px-5">Due Date</th>
                  <th className="px-4 py-4 md:px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-sm space-y-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2457F0]">
                          <Receipt className="h-7 w-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No invoices found</h3>
                        <p className="text-xs text-slate-500">
                          {query || status !== 'All'
                            ? 'No invoices match your active filters.'
                            : 'Create professional, branded invoices in less than 2 minutes.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/create-invoice')}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#2457F0] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create New Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => (
                    <tr key={inv.id} className="border-t border-slate-200/70 text-[14px] hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-5 md:px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2457F0]">
                            <FileSpreadsheet className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{inv.invoiceNumber}</p>
                            <p className="mt-0.5 text-[12px] text-slate-400">{inv.businessName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 md:px-5">
                        <p className="font-medium text-slate-900">{inv.clientName}</p>
                        {inv.billedToCompany && (
                          <p className="mt-0.5 text-[12px] text-slate-400">{inv.billedToCompany}</p>
                        )}
                      </td>
                      <td className="px-4 py-5 md:px-5 font-semibold text-slate-900">
                        {formatMoney(inv.amount)}
                      </td>
                      <td className="px-4 py-5 md:px-5">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-600'
                              : inv.status === 'Sent'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-5 md:px-5 text-slate-700">
                        {inv.invoiceDate}
                      </td>
                      <td className="px-4 py-5 md:px-5 text-slate-500 text-xs">
                        {inv.dueDate || '-'}
                      </td>
                      <td className="px-4 py-5 md:px-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate('/create-invoice/design')}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xs hover:bg-slate-50"
                            title="View / Edit Invoice"
                          >
                            <Eye className="h-4 w-4 text-[#2457F0]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xs hover:bg-red-50 text-slate-400 hover:text-red-500"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-4 w-4" />
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
