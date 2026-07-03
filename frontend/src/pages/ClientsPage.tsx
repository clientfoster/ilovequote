import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from '../customerApi';
import { Customer } from '../types';

const emptyCustomer: Customer = {
  id: '',
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  website: '',
  taxIdType: 'GSTIN',
  taxId: '',
  poNumber: '',
  billingAddress: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  notes: '',
};

function CustomerField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[13px] font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#2457F0]"
      />
    </label>
  );
}

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState<Customer>(emptyCustomer);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter((customer) =>
      !needle || [
        customer.companyName,
        customer.contactPerson,
        customer.email,
        customer.phone,
        customer.city,
        customer.country,
      ].join(' ').toLowerCase().includes(needle),
    );
  }, [customers, query]);

  const resetForm = () => {
    setEditingCustomerId(null);
    setForm(emptyCustomer);
  };

  const handleSubmit = async () => {
    if (!form.companyName.trim() && !form.contactPerson.trim()) return;

    try {
      setIsSaving(true);
      if (editingCustomerId) {
        const result = await updateCustomer(editingCustomerId, form);
        setCustomers((current) => current.map((item) => (item.id === editingCustomerId ? result.customer : item)));
      } else {
        const result = await createCustomer(form);
        setCustomers((current) => [result.customer, ...current]);
      }
      resetForm();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setForm(customer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.companyName || customer.contactPerson || 'this customer'}?`)) return;
    try {
      await deleteCustomer(customer.id);
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      if (editingCustomerId === customer.id) resetForm();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete customer.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1320px] space-y-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Customers</h1>
          <p className="mt-2 text-[15px] text-slate-500">
            Save multiple customer records here, then fetch them directly while creating invoices.
          </p>
        </div>

        <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">
                {editingCustomerId ? 'Edit Customer' : 'Create Customer'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Contact details saved here will be available in the invoice flow.</p>
            </div>
            {editingCustomerId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CustomerField label="Company Name" value={form.companyName} onChange={(companyName) => setForm((current) => ({ ...current, companyName }))} />
            <CustomerField label="Contact Person" value={form.contactPerson} onChange={(contactPerson) => setForm((current) => ({ ...current, contactPerson }))} />
            <CustomerField label="Email" type="email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} />
            <CustomerField label="Phone" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} />
            <CustomerField label="Website" value={form.website} onChange={(website) => setForm((current) => ({ ...current, website }))} />
            <CustomerField label="Tax ID" value={form.taxId} onChange={(taxId) => setForm((current) => ({ ...current, taxId }))} />
            <CustomerField label="PO Number" value={form.poNumber} onChange={(poNumber) => setForm((current) => ({ ...current, poNumber }))} />
            <CustomerField label="Billing Address" value={form.billingAddress} onChange={(billingAddress) => setForm((current) => ({ ...current, billingAddress }))} />
            <CustomerField label="City" value={form.city} onChange={(city) => setForm((current) => ({ ...current, city }))} />
            <CustomerField label="State" value={form.state} onChange={(state) => setForm((current) => ({ ...current, state }))} />
            <CustomerField label="Postal Code" value={form.zipCode} onChange={(zipCode) => setForm((current) => ({ ...current, zipCode }))} />
            <CustomerField label="Country" value={form.country} onChange={(country) => setForm((current) => ({ ...current, country }))} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#2457F0] px-5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? 'Saving...' : editingCustomerId ? 'Update Customer' : 'Save Customer'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm"
            >
              Clear Form
            </button>
          </div>
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#EEF3FF] text-[#2457F0]">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Saved Customers</h2>
                <p className="mt-1 text-sm text-slate-500">{customers.length} customer record{customers.length === 1 ? '' : 's'} in your account</p>
              </div>
            </div>

            <div className="flex items-center rounded-[12px] border border-slate-200 bg-white px-4 py-3 shadow-sm md:w-[380px]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customers..."
                className="w-full border-none bg-transparent text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              <Search className="h-5 w-5 shrink-0 text-slate-700" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left">
              <thead className="bg-[#FBFCFF]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                  <th className="px-5 py-4">Company</th>
                  <th className="px-5 py-4">Contact Person</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Address</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      No customers saved yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer) => (
                    <tr key={customer.id} className="border-t border-slate-200/70 text-[14px]">
                      <td className="px-5 py-4 font-semibold text-slate-900">{customer.companyName || '-'}</td>
                      <td className="px-5 py-4 text-slate-700">{customer.contactPerson || '-'}</td>
                      <td className="px-5 py-4 text-slate-700">{customer.email || '-'}</td>
                      <td className="px-5 py-4 text-slate-700">{customer.phone || '-'}</td>
                      <td className="px-5 py-4 text-slate-700">{[customer.billingAddress, customer.city, customer.country].filter(Boolean).join(', ') || '-'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(customer)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
                            title="Edit customer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(customer)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-red-500 shadow-sm"
                            title="Delete customer"
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
