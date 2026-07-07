import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  Building2,
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
} from 'lucide-react';
import { getScopedStorageKey } from '../auth';
import { BusinessFormValues } from '../types';
import { BUSINESS_DRAFT_KEY, DEFAULT_BUSINESS_VALUES } from '../wizard/WizardState';

const BUSINESS_LIBRARY_KEY = 'ilovequote_invoice_business_library';

type BusinessRecord = BusinessFormValues & {
  contactPerson?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ViewMode = 'list' | 'form' | 'details';
type SortMode = 'recently-added' | 'recently-updated' | 'name-asc' | 'name-desc';

const emptyBusiness: BusinessRecord = {
  ...DEFAULT_BUSINESS_VALUES,
  companyName: '',
  contactPerson: '',
  tagline: '',
  email: '',
  phone: '',
  website: '',
  logo: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: DEFAULT_BUSINESS_VALUES.country || 'India',
  taxType: 'GSTIN',
  taxId: '',
  socialLinks: [],
  businessSlug: '',
  createdAt: '',
  updatedAt: '',
} as BusinessRecord;

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeBusinessProfile(profile: Partial<BusinessRecord> = {}): BusinessRecord {
  const createdAt = profile.createdAt || profile.updatedAt || '';
  return {
    ...emptyBusiness,
    ...profile,
    companyName: profile.companyName || '',
    contactPerson: profile.contactPerson || '',
    tagline: '',
    email: profile.email || '',
    phone: profile.phone || '',
    website: '',
    logo: '',
    address: profile.address || '',
    city: profile.city || '',
    state: profile.state || '',
    zipCode: profile.zipCode || '',
    country: profile.country || emptyBusiness.country || '',
    taxType: profile.taxType || emptyBusiness.taxType,
    taxId: profile.taxId || '',
    socialLinks: [],
    businessSlug: '',
    createdAt,
    updatedAt: profile.updatedAt || createdAt,
  };
}

function buildBusinessKey(profile: Partial<BusinessRecord>) {
  return [
    profile.companyName,
    profile.email,
    profile.phone,
    profile.address,
    profile.city,
    profile.state,
    profile.zipCode,
    profile.country,
    profile.taxType,
    profile.taxId,
  ]
    .map((part) => String(part || '').trim().toLowerCase())
    .join('|');
}

function loadBusinessLibrary() {
  if (!canUseLocalStorage()) return [] as BusinessRecord[];

  try {
    const raw = localStorage.getItem(getScopedStorageKey(BUSINESS_LIBRARY_KEY));
    const parsed = raw ? (JSON.parse(raw) as Partial<BusinessRecord>[]) : [];
    return Array.isArray(parsed) ? parsed.map((record) => normalizeBusinessProfile(record)) : [];
  } catch {
    return [];
  }
}

function loadBusinessDraft() {
  if (!canUseLocalStorage()) return emptyBusiness;

  try {
    const raw = localStorage.getItem(getScopedStorageKey(BUSINESS_DRAFT_KEY));
    if (!raw) return emptyBusiness;
    return normalizeBusinessProfile(JSON.parse(raw) as Partial<BusinessRecord>);
  } catch {
    return emptyBusiness;
  }
}

function persistBusinessLibrary(records: BusinessRecord[]) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(getScopedStorageKey(BUSINESS_LIBRARY_KEY), JSON.stringify(records));
}

function persistBusinessDraft(profile: BusinessRecord) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(getScopedStorageKey(BUSINESS_DRAFT_KEY), JSON.stringify(profile));
}

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
  if (!trimmed) return 'B';
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

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>('recently-added');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hasEmail: false,
    hasPhone: false,
    hasTaxId: false,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingBusinessKey, setEditingBusinessKey] = useState<string | null>(null);
  const [selectedBusinessKey, setSelectedBusinessKey] = useState<string | null>(null);
  const [form, setForm] = useState<BusinessRecord>(loadBusinessDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = () => {
      const savedBusinesses = loadBusinessLibrary();
      setBusinesses(savedBusinesses);

      const draft = loadBusinessDraft();
      setForm(draft);
      setEditingBusinessKey(draft.companyName ? buildBusinessKey(draft) : null);
    };

    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  useEffect(() => {
    persistBusinessDraft(normalizeBusinessProfile(form));
  }, [form]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortBy, filters.hasEmail, filters.hasPhone, filters.hasTaxId, viewMode]);

  const normalizedSearch = query.trim().toLowerCase();

  const sortedBusinesses = useMemo(() => {
    const list = [...businesses];
    const byDate = (value: BusinessRecord) => new Date(value.createdAt || value.updatedAt || 0).getTime();
    const byUpdated = (value: BusinessRecord) => new Date(value.updatedAt || value.createdAt || 0).getTime();

    const filtered = list.filter((business) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          business.companyName,
          business.contactPerson,
          business.email,
          business.phone,
          business.address,
          business.city,
          business.state,
          business.country,
          business.taxId,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesHasEmail = !filters.hasEmail || Boolean(business.email?.trim());
      const matchesHasPhone = !filters.hasPhone || Boolean(business.phone?.trim());
      const matchesHasTaxId = !filters.hasTaxId || Boolean(business.taxId?.trim());

      return matchesSearch && matchesHasEmail && matchesHasPhone && matchesHasTaxId;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.companyName || '').localeCompare(b.companyName || '');
        case 'name-desc':
          return (b.companyName || '').localeCompare(a.companyName || '');
        case 'recently-updated':
          return byUpdated(b) - byUpdated(a);
        case 'recently-added':
        default:
          return byDate(b) - byDate(a);
      }
    });

    return filtered;
  }, [businesses, filters, normalizedSearch, sortBy]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(sortedBusinesses.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = sortedBusinesses.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, sortedBusinesses.length);
  const paginatedBusinesses = sortedBusinesses.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const selectedBusiness = useMemo(
    () => businesses.find((business) => buildBusinessKey(business) === selectedBusinessKey) || null,
    [businesses, selectedBusinessKey],
  );

  const resetForm = () => {
    setEditingBusinessKey(null);
    setForm(emptyBusiness);
    persistBusinessDraft(emptyBusiness);
  };

  const openCreateForm = () => {
    resetForm();
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditForm = (business: BusinessRecord) => {
    setEditingBusinessKey(buildBusinessKey(business));
    setForm(normalizeBusinessProfile(business));
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDetails = (business: BusinessRecord) => {
    setSelectedBusinessKey(buildBusinessKey(business));
    setViewMode('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closePanels = () => {
    setViewMode('list');
    setSelectedBusinessKey(null);
  };

  const handleSubmit = async () => {
    if (!form.companyName.trim()) return;

    try {
      setIsSaving(true);
      const now = new Date().toISOString();
      const normalized = normalizeBusinessProfile({
        ...form,
        createdAt: editingBusinessKey ? form.createdAt || now : form.createdAt || now,
        updatedAt: now,
      });
      const nextKey = buildBusinessKey(normalized);
      const nextBusinesses = [
        normalized,
        ...businesses.filter((item) => buildBusinessKey(item) !== editingBusinessKey && buildBusinessKey(item) !== nextKey),
      ];

      setBusinesses(nextBusinesses);
      persistBusinessLibrary(nextBusinesses);
      persistBusinessDraft(normalized);
      setForm(normalized);
      setEditingBusinessKey(nextKey);
      setViewMode('list');
      setSelectedBusinessKey(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not save business profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (business: BusinessRecord) => {
    if (!window.confirm(`Delete ${business.companyName || 'this business'}?`)) return;

    try {
      const key = buildBusinessKey(business);
      const next = businesses.filter((item) => buildBusinessKey(item) !== key);
      setBusinesses(next);
      persistBusinessLibrary(next);
      if (editingBusinessKey === key) resetForm();
      if (selectedBusinessKey === key) closePanels();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete business.');
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSortBy('recently-added');
    setFilters({ hasEmail: false, hasPhone: false, hasTaxId: false });
  };

  const renderBusinessList = () => {
    const hasBusinesses = businesses.length > 0;

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#111827]">Business List</h1>
            <p className="mt-2 text-[14px] text-[#6B7280]">Manage all your business profiles in one place.</p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add New Business
          </button>
        </div>

        {!hasBusinesses ? (
          <div className="mt-8 flex min-h-[520px] items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-[#FBFCFF] px-6 py-12">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                <Building2 className="h-12 w-12" />
              </div>
              <h2 className="mt-6 text-[20px] font-semibold text-[#111827]">No Businesses Yet</h2>
              <p className="mt-2 text-[14px] text-[#6B7280]">You haven&apos;t added any business profiles yet.</p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
              >
                <Plus className="h-4 w-4" />
                Add Business
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
                  placeholder="Search businesses..."
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
                    <option value="name-asc">Business Name (A to Z)</option>
                    <option value="name-desc">Business Name (Z to A)</option>
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
                {paginatedBusinesses.length === 0 ? (
                  <div className="px-5 py-12 text-center text-[14px] text-[#6B7280]">
                    No businesses match your search or filters.
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
                    {paginatedBusinesses.map((business) => {
                      const key = buildBusinessKey(business);
                      const name = business.companyName || 'Business';
                      return (
                        <article key={key} className="rounded-[12px] border border-[#E5E7EB] bg-[#FBFCFF] p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <AvatarBadge label={name} />
                              <div className="min-w-0">
                                <div className="truncate text-[14px] font-semibold text-[#111827]">{name}</div>
                                <div className="mt-1 truncate text-[12px] text-[#6B7280]">
                                  {business.contactPerson || 'No contact person'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ActionIcon icon={<Eye className="h-4 w-4" />} label="View business" onClick={() => openDetails(business)} />
                              <ActionIcon icon={<Pencil className="h-4 w-4" />} label="Edit business" onClick={() => openEditForm(business)} />
                              <ActionIcon
                                icon={<Trash2 className="h-4 w-4" />}
                                label="Delete business"
                                onClick={() => handleDelete(business)}
                                tone="danger"
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2">
                            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2">
                              <span className="text-[13px] text-[#6B7280]">Email</span>
                              <span className="truncate text-right text-[13px] text-[#111827]">{business.email || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2">
                              <span className="text-[13px] text-[#6B7280]">Phone</span>
                              <span className="truncate text-right text-[13px] text-[#111827]">{business.phone || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2">
                              <span className="text-[13px] text-[#6B7280]">Created</span>
                              <span className="text-[13px] text-[#111827]">{formatDate(business.createdAt || business.updatedAt)}</span>
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
                      <th className="px-5 py-3">Business Name</th>
                      <th className="px-5 py-3">Contact Person</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Phone</th>
                      <th className="px-5 py-3">Created Date</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBusinesses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-[14px] text-[#6B7280]">
                          No businesses match your search or filters.
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
                      paginatedBusinesses.map((business) => {
                        const key = buildBusinessKey(business);
                        const name = business.companyName || 'Business';
                        return (
                          <tr key={key} className="group border-t border-[#E5E7EB] text-[14px] transition hover:bg-[#F8FAFC]">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <AvatarBadge label={name} />
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-[#111827]">{name}</div>
                                  <div className="mt-1 truncate text-[12px] text-[#6B7280]">
                                    {[business.city, business.country].filter(Boolean).join(', ') || 'No location added'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[#111827]">{business.contactPerson || '-'}</td>
                            <td className="px-5 py-3 text-[#6B7280]">{business.email || '-'}</td>
                            <td className="px-5 py-3 text-[#6B7280]">{business.phone || '-'}</td>
                            <td className="px-5 py-3 text-[#6B7280]">{formatDate(business.createdAt || business.updatedAt)}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                                <ActionIcon icon={<Eye className="h-4 w-4" />} label="View business" onClick={() => openDetails(business)} />
                                <ActionIcon icon={<Pencil className="h-4 w-4" />} label="Edit business" onClick={() => openEditForm(business)} />
                                <ActionIcon
                                  icon={<Trash2 className="h-4 w-4" />}
                                  label="Delete business"
                                  onClick={() => handleDelete(business)}
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

              {paginatedBusinesses.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-[#6B7280]">
                    Showing {startIndex} to {endIndex} of {sortedBusinesses.length} businesses
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
    const isEditing = Boolean(editingBusinessKey);

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closePanels}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#111827] shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Business List
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
              {isEditing ? 'Edit Business' : 'Add New Business'}
            </h2>
            <p className="mt-1 text-[14px] text-[#6B7280]">Enter the business details that will be used later in invoices and lists.</p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SectionCard title="Business Information" description="Core details for the business profile.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Business Name" value={form.companyName} onChange={(companyName) => setForm((current) => ({ ...current, companyName }))} placeholder="Enter business name" />
                <Field label="Contact Person" value={form.contactPerson || ''} onChange={(contactPerson) => setForm((current) => ({ ...current, contactPerson }))} placeholder="Enter contact person" />
              </div>
            </SectionCard>

            <SectionCard title="Contact Information" description="How people can reach this business.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email" type="email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} placeholder="Enter email" />
                <Field label="Phone" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} placeholder="Enter phone number" />
              </div>
            </SectionCard>

            <SectionCard title="Address" description="Address details shown in the business profile.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Address" value={form.address} onChange={(address) => setForm((current) => ({ ...current, address }))} placeholder="Enter address" />
                </div>
                <Field label="City" value={form.city} onChange={(city) => setForm((current) => ({ ...current, city }))} placeholder="Enter city" />
                <Field label="State" value={form.state} onChange={(state) => setForm((current) => ({ ...current, state }))} placeholder="Enter state" />
                <Field label="Postal Code" value={form.zipCode} onChange={(zipCode) => setForm((current) => ({ ...current, zipCode }))} placeholder="Enter postal code" />
                <Field label="Country" value={form.country} onChange={(country) => setForm((current) => ({ ...current, country }))} placeholder="Enter country" />
              </div>
            </SectionCard>

            <SectionCard title="Tax Details" description="Tax information used for invoice formatting.">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Tax Type"
                  value={form.taxType}
                  onChange={(taxType) => setForm((current) => ({ ...current, taxType: taxType as BusinessFormValues['taxType'] }))}
                  options={[
                    { value: 'GSTIN', label: 'GSTIN' },
                    { value: 'PAN', label: 'PAN' },
                    { value: 'VAT', label: 'VAT' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
                <Field label="Tax ID" value={form.taxId} onChange={(taxId) => setForm((current) => ({ ...current, taxId }))} placeholder="Enter tax ID" />
              </div>
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
              {isSaving ? 'Saving...' : isEditing ? 'Update Business' : 'Save Business'}
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
    if (!selectedBusiness) return null;

    const business = selectedBusiness;

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closePanels}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#111827] shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Business List
          </button>

          <div className="inline-flex h-[42px] items-center rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-semibold text-[#6B7280] shadow-sm">
            Business Details
          </div>
        </div>

        <div className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <AvatarBadge label={business.companyName || 'Business'} />
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827]">{business.companyName || '-'}</h2>
                <p className="mt-1 text-[14px] text-[#6B7280]">{business.contactPerson || 'No contact person added'}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1 text-[12px] font-semibold text-[#16A34A]">
              <CalendarDays className="h-3.5 w-3.5" />
              Created {formatDate(business.createdAt || business.updatedAt)}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SectionCard title="Business Information" description="Overview of this business profile.">
              <div className="grid gap-3 md:grid-cols-2">
                {detailRow('Business Name', business.companyName)}
                {detailRow('Contact Person', business.contactPerson || '')}
              </div>
            </SectionCard>

            <SectionCard title="Contact Information" description="Phone and email details.">
              <div className="grid gap-3 md:grid-cols-2">
                {detailRow('Email', business.email || '')}
                {detailRow('Phone', business.phone || '')}
              </div>
            </SectionCard>

            <SectionCard title="Address" description="Location details for the business.">
              <div className="grid gap-3 md:grid-cols-2">
                {detailRow('Address', business.address || '')}
                {detailRow('City', business.city || '')}
                {detailRow('State', business.state || '')}
                {detailRow('Postal Code', business.zipCode || '')}
                {detailRow('Country', business.country || '')}
              </div>
            </SectionCard>

            <SectionCard title="Tax Details" description="Tax IDs and classification.">
              <div className="grid gap-3 md:grid-cols-2">
                {detailRow('Tax Type', business.taxType || '')}
                {detailRow('Tax ID', business.taxId || '')}
              </div>
            </SectionCard>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openEditForm(business)}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
            >
              <Pencil className="h-4 w-4" />
              Edit Business
            </button>
            <button
              type="button"
              onClick={() => handleDelete(business)}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-5 text-[14px] font-semibold text-[#EF4444] shadow-sm transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Business
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
          {viewMode === 'form'
            ? renderFormView()
            : viewMode === 'details'
              ? renderDetailsView()
              : renderBusinessList()}
        </div>
      </div>
    </div>
  );
}
