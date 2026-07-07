import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from '../customerApi';
import { Customer } from '../types';

type ViewMode = 'list' | 'form' | 'details';
type SortMode = 'recently-added' | 'recently-updated' | 'name-asc' | 'name-desc';

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

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getInitials(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return 'C';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[13px] font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-[44px] w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[13px] font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[44px] w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827]">{title}</h3>
        <p className="mt-1 text-[14px] text-[#6B7280]">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AvatarBadge({ label }: { label: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EEF4FF] text-[13px] font-bold text-[#2563EB]">
      {getInitials(label)}
    </div>
  );
}

function ActionIcon({
  icon,
  label,
  onClick,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border bg-white text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        tone === 'danger'
          ? 'border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50'
          : 'border-[#E5E7EB] text-slate-600 hover:border-[#CBD5E1] hover:bg-slate-50'
      }`}
    >
      {icon}
    </button>
  );
}

function detailRow(label: string, value: string) {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-[#FBFCFF] px-4 py-3">
      <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">{label}</div>
      <div className="mt-1 text-[14px] font-medium text-[#111827]">{value || '-'}</div>
    </div>
  );
}

function customerDisplayLabel(customer: Customer) {
  return customer.companyName || customer.contactPerson || 'Customer';
}

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>('recently-added');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hasEmail: false,
    hasPhone: false,
    hasTaxId: false,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState<Customer>(emptyCustomer);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortBy, filters.hasEmail, filters.hasPhone, filters.hasTaxId, viewMode]);

  const normalizedSearch = query.trim().toLowerCase();

  const sortedCustomers = useMemo(() => {
    const byDate = (value: Customer) => new Date(value.createdAt || value.updatedAt || 0).getTime();
    const byUpdated = (value: Customer) => new Date(value.updatedAt || value.createdAt || 0).getTime();

    const filtered = customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          customer.companyName,
          customer.contactPerson,
          customer.email,
          customer.phone,
          customer.billingAddress,
          customer.city,
          customer.state,
          customer.country,
          customer.taxId,
          customer.poNumber,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesHasEmail = !filters.hasEmail || Boolean(customer.email?.trim());
      const matchesHasPhone = !filters.hasPhone || Boolean(customer.phone?.trim());
      const matchesHasTaxId = !filters.hasTaxId || Boolean(customer.taxId?.trim());

      return matchesSearch && matchesHasEmail && matchesHasPhone && matchesHasTaxId;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return customerDisplayLabel(a).localeCompare(customerDisplayLabel(b));
        case 'name-desc':
          return customerDisplayLabel(b).localeCompare(customerDisplayLabel(a));
        case 'recently-updated':
          return byUpdated(b) - byUpdated(a);
        case 'recently-added':
        default:
          return byDate(b) - byDate(a);
      }
    });

    return filtered;
  }, [customers, filters, normalizedSearch, sortBy]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = sortedCustomers.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, sortedCustomers.length);
  const paginatedCustomers = sortedCustomers.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const resetForm = () => {
    setEditingCustomerId(null);
    setForm(emptyCustomer);
  };

  const openCreateForm = () => {
    resetForm();
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setForm(customer);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDetails = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setViewMode('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closePanels = () => {
    setViewMode('list');
    setSelectedCustomerId(null);
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
      setViewMode('list');
      setSelectedCustomerId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.companyName || customer.contactPerson || 'this customer'}?`)) return;
    try {
      await deleteCustomer(customer.id);
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      if (editingCustomerId === customer.id) resetForm();
      if (selectedCustomerId === customer.id) closePanels();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete customer.');
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSortBy('recently-added');
    setFilters({ hasEmail: false, hasPhone: false, hasTaxId: false });
  };

  const renderCustomerList = () => {
    const hasCustomers = customers.length > 0;

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#111827]">Customer List</h1>
            <p className="mt-2 text-[14px] text-[#6B7280]">Manage all your customer profiles in one place.</p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add New Customer
          </button>
        </div>

        {!hasCustomers ? (
          <div className="mt-8 flex min-h-[520px] items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-[#FBFCFF] px-6 py-12">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                <Users className="h-12 w-12" />
              </div>
              <h2 className="mt-6 text-[20px] font-semibold text-[#111827]">No Customers Yet</h2>
              <p className="mt-2 text-[14px] text-[#6B7280]">You haven&apos;t added any customer profiles yet.</p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[420px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search customers..."
                  className="h-[42px] w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-10 pr-4 text-[14px] text-[#111827] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="relative min-w-[190px]">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortMode)}
                    className="h-[42px] w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-10 pr-9 text-[14px] text-[#111827] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="recently-added">Sort by: Recently Added</option>
                    <option value="recently-updated">Sort by: Recently Updated</option>
                    <option value="name-asc">Customer Name (A to Z)</option>
                    <option value="name-desc">Customer Name (Z to A)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters((current) => !current)}
                  className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#111827] shadow-sm transition hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>
            </div>

            {showFilters ? (
              <div className="mt-4 rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#FBFCFF] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filters.hasEmail}
                      onChange={(event) => setFilters((current) => ({ ...current, hasEmail: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-[14px] text-[#111827]">Has Email</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#FBFCFF] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filters.hasPhone}
                      onChange={(event) => setFilters((current) => ({ ...current, hasPhone: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-[14px] text-[#111827]">Has Phone</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#FBFCFF] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filters.hasTaxId}
                      onChange={(event) => setFilters((current) => ({ ...current, hasTaxId: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-[14px] text-[#111827]">Has Tax ID</span>
                  </label>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-[38px] items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-semibold text-[#111827] transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
              <div className="md:hidden">
                {paginatedCustomers.length === 0 ? (
                  <div className="px-5 py-12 text-center text-[14px] text-[#6B7280]">
                    No customers match your search or filters.
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex h-[38px] items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-semibold text-[#111827]"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {paginatedCustomers.map((customer) => {
                      const name = customerDisplayLabel(customer);
                      return (
                        <article key={customer.id} className="rounded-[12px] border border-[#E5E7EB] bg-[#FBFCFF] p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <AvatarBadge label={name} />
                              <div className="min-w-0">
                                <div className="truncate text-[14px] font-semibold text-[#111827]">{name}</div>
                                <div className="mt-1 truncate text-[12px] text-[#6B7280]">
                                  {customer.contactPerson || 'No contact person'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ActionIcon icon={<Eye className="h-4 w-4" />} label="View customer" onClick={() => openDetails(customer)} />
                              <ActionIcon icon={<Pencil className="h-4 w-4" />} label="Edit customer" onClick={() => openEditForm(customer)} />
                              <ActionIcon
                                icon={<Trash2 className="h-4 w-4" />}
                                label="Delete customer"
                                onClick={() => handleDelete(customer)}
                                tone="danger"
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2">
                            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2">
                              <span className="text-[13px] text-[#6B7280]">Email</span>
                              <span className="truncate text-right text-[13px] text-[#111827]">{customer.email || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2">
                              <span className="text-[13px] text-[#6B7280]">Phone</span>
                              <span className="truncate text-right text-[13px] text-[#111827]">{customer.phone || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2">
                              <span className="text-[13px] text-[#6B7280]">Created</span>
                              <span className="text-[13px] text-[#111827]">{formatDate(customer.createdAt || customer.updatedAt)}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[1120px] w-full border-collapse text-left">
                  <thead className="bg-[#FBFCFF]">
                    <tr className="text-[14px] font-semibold text-[#111827]">
                      <th className="px-5 py-3">Customer Name</th>
                      <th className="px-5 py-3">Contact Person</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Phone</th>
                      <th className="px-5 py-3">Created Date</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-[14px] text-[#6B7280]">
                          No customers match your search or filters.
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="ml-3 inline-flex h-[38px] items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-semibold text-[#111827]"
                          >
                            Clear Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((customer) => {
                        const name = customerDisplayLabel(customer);
                        return (
                          <tr key={customer.id} className="group border-t border-[#E5E7EB] text-[14px] transition hover:bg-[#F8FAFC]">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <AvatarBadge label={name} />
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-[#111827]">{name}</div>
                                  <div className="mt-1 truncate text-[12px] text-[#6B7280]">
                                    {[customer.city, customer.country].filter(Boolean).join(', ') || 'No location added'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[#111827]">{customer.contactPerson || '-'}</td>
                            <td className="px-5 py-3 text-[#6B7280]">{customer.email || '-'}</td>
                            <td className="px-5 py-3 text-[#6B7280]">{customer.phone || '-'}</td>
                            <td className="px-5 py-3 text-[#6B7280]">{formatDate(customer.createdAt || customer.updatedAt)}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                                <ActionIcon icon={<Eye className="h-4 w-4" />} label="View customer" onClick={() => openDetails(customer)} />
                                <ActionIcon icon={<Pencil className="h-4 w-4" />} label="Edit customer" onClick={() => openEditForm(customer)} />
                                <ActionIcon
                                  icon={<Trash2 className="h-4 w-4" />}
                                  label="Delete customer"
                                  onClick={() => handleDelete(customer)}
                                  tone="danger"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {paginatedCustomers.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-[#6B7280]">
                    Showing {startIndex} to {endIndex} of {sortedCustomers.length} customers
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={safePage === 1}
                      className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex h-[34px] min-w-[34px] items-center justify-center rounded-[8px] border px-3 text-[13px] font-semibold transition ${
                          page === safePage
                            ? 'border-[#2563EB] bg-[#2563EB] text-white'
                            : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={safePage === totalPages}
                      className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderFormView = () => {
    const isEditing = Boolean(editingCustomerId);

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closePanels}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#111827] shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer List
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              closePanels();
            }}
            className="inline-flex h-[42px] items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#111827] shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827]">
              {isEditing ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <p className="mt-1 text-[14px] text-[#6B7280]">Enter the customer details that will be used later in invoices and lists.</p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SectionCard title="Customer Information" description="Core profile details for this customer.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Company Name" value={form.companyName} onChange={(companyName) => setForm((current) => ({ ...current, companyName }))} placeholder="Enter company name" />
                <Field label="Contact Person" value={form.contactPerson} onChange={(contactPerson) => setForm((current) => ({ ...current, contactPerson }))} placeholder="Enter contact person" />
              </div>
            </SectionCard>

            <SectionCard title="Contact Information" description="How people can reach the customer.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email" type="email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} placeholder="Enter email" />
                <Field label="Phone" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} placeholder="Enter phone number" />
              </div>
            </SectionCard>

            <SectionCard title="Address" description="Address details shown in the customer profile.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Billing Address" value={form.billingAddress} onChange={(billingAddress) => setForm((current) => ({ ...current, billingAddress }))} placeholder="Enter billing address" />
                </div>
                <Field label="City" value={form.city} onChange={(city) => setForm((current) => ({ ...current, city }))} placeholder="Enter city" />
                <Field label="State" value={form.state} onChange={(state) => setForm((current) => ({ ...current, state }))} placeholder="Enter state" />
                <Field label="Postal Code" value={form.zipCode} onChange={(zipCode) => setForm((current) => ({ ...current, zipCode }))} placeholder="Enter postal code" />
                <Field label="Country" value={form.country} onChange={(country) => setForm((current) => ({ ...current, country }))} placeholder="Enter country" />
              </div>
            </SectionCard>

            <SectionCard title="Tax Details" description="Tax IDs and billing references.">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Tax ID Type"
                  value={form.taxIdType}
                  onChange={(taxIdType) => setForm((current) => ({ ...current, taxIdType: taxIdType as Customer['taxIdType'] }))}
                  options={[
                    { value: 'GSTIN', label: 'GSTIN' },
                    { value: 'VAT', label: 'VAT' },
                    { value: 'PAN', label: 'PAN' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
                <Field label="Tax ID" value={form.taxId} onChange={(taxId) => setForm((current) => ({ ...current, taxId }))} placeholder="Enter tax ID" />
                <Field label="PO Number" value={form.poNumber} onChange={(poNumber) => setForm((current) => ({ ...current, poNumber }))} placeholder="Enter PO number" />
                <Field label="Website" value={form.website} onChange={(website) => setForm((current) => ({ ...current, website }))} placeholder="Enter website" />
              </div>
            </SectionCard>

            <SectionCard title="Notes" description="Optional internal notes for this customer.">
              <label className="space-y-2">
                <span className="block text-[13px] font-semibold text-slate-700">Notes</span>
                <textarea
                  value={form.notes || ''}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Add any notes here"
                  className="min-h-[120px] w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-3 text-[14px] text-slate-700 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </SectionCard>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? 'Saving...' : isEditing ? 'Update Customer' : 'Save Customer'}
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                closePanels();
              }}
              className="inline-flex h-[42px] items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white px-5 text-[14px] font-semibold text-[#111827] shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsView = () => {
    if (!selectedCustomer) return null;

    const customer = selectedCustomer;

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closePanels}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#111827] shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer List
          </button>

          <div className="inline-flex h-[42px] items-center rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-semibold text-[#6B7280] shadow-sm">
            Customer Details
          </div>
        </div>

        <div className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <AvatarBadge label={customerDisplayLabel(customer)} />
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827]">{customerDisplayLabel(customer)}</h2>
                <p className="mt-1 text-[14px] text-[#6B7280]">{customer.contactPerson || 'No contact person added'}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-[12px] font-semibold text-[#2563EB]">
              <CalendarDays className="h-3.5 w-3.5" />
              Created {formatDate(customer.createdAt || customer.updatedAt)}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SectionCard title="Customer Information" description="Overview of this customer profile.">
              <div className="grid gap-3 md:grid-cols-2">
                {detailRow('Company Name', customer.companyName)}
                {detailRow('Contact Person', customer.contactPerson)}
              </div>
            </SectionCard>

            <SectionCard title="Contact Information" description="Phone and email details.">
              <div className="grid gap-3 md:grid-cols-2">
                {detailRow('Email', customer.email || '')}
                {detailRow('Phone', customer.phone || '')}
              </div>
            </SectionCard>

            <SectionCard title="Address" description="Location details for the customer.">
              <div className="grid gap-3 md:grid-cols-2">
                {detailRow('Billing Address', customer.billingAddress || '')}
                {detailRow('City', customer.city || '')}
                {detailRow('State', customer.state || '')}
                {detailRow('Postal Code', customer.zipCode || '')}
                {detailRow('Country', customer.country || '')}
              </div>
            </SectionCard>

            <SectionCard title="Tax Details" description="Tax IDs and billing references.">
              <div className="grid gap-3 md:grid-cols-2">
                {detailRow('Tax ID Type', customer.taxIdType || '')}
                {detailRow('Tax ID', customer.taxId || '')}
                {detailRow('PO Number', customer.poNumber || '')}
                {detailRow('Website', customer.website || '')}
              </div>
            </SectionCard>

            <div className="lg:col-span-2">
              <SectionCard title="Notes" description="Optional internal notes.">
                {detailRow('Notes', customer.notes || '')}
              </SectionCard>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openEditForm(customer)}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
            >
              <Pencil className="h-4 w-4" />
              Edit Customer
            </button>
            <button
              type="button"
              onClick={() => handleDelete(customer)}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-5 text-[14px] font-semibold text-[#EF4444] shadow-sm transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Customer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm transition-shadow">
          {viewMode === 'form' ? renderFormView() : viewMode === 'details' ? renderDetailsView() : renderCustomerList()}
        </div>
      </div>
    </div>
  );
}
