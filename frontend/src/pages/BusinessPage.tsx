import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { getScopedStorageKey } from '../auth';
import { BusinessFormValues } from '../types';
import { BUSINESS_DRAFT_KEY, DEFAULT_BUSINESS_VALUES } from '../wizard/WizardState';

const BUSINESS_LIBRARY_KEY = 'ilovequote_invoice_business_library';

type BusinessRecord = BusinessFormValues & {
  updatedAt?: string;
};

const emptyBusiness: BusinessFormValues = {
  ...DEFAULT_BUSINESS_VALUES,
  companyName: '',
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
};

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeBusinessProfile(profile: Partial<BusinessRecord> = {}): BusinessRecord {
  return {
    ...emptyBusiness,
    ...profile,
    companyName: profile.companyName || '',
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
    updatedAt: profile.updatedAt,
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

function BusinessField({
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

function BusinessSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[13px] font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#2457F0]"
      >
        <option value="GSTIN">GSTIN</option>
        <option value="PAN">PAN</option>
        <option value="VAT">VAT</option>
        <option value="Other">Other</option>
      </select>
    </label>
  );
}

function BusinessActions({
  business,
  onEdit,
  onDelete,
}: {
  business: BusinessRecord;
  onEdit: (business: BusinessRecord) => void;
  onDelete: (business: BusinessRecord) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onEdit(business)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        title="Edit business"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(business)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-red-500 shadow-sm transition hover:bg-red-50"
        title="Delete business"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [query, setQuery] = useState('');
  const [editingBusinessKey, setEditingBusinessKey] = useState<string | null>(null);
  const [form, setForm] = useState<BusinessRecord>(loadBusinessDraft());
  const [isSaving, setIsSaving] = useState(false);

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

  const filteredBusinesses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return businesses.filter((business) => {
      if (!needle) return true;
      return [
        business.companyName,
        business.email,
        business.phone,
        business.address,
        business.city,
        business.country,
        business.taxId,
        business.taxType,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [businesses, query]);

  const resetForm = () => {
    setEditingBusinessKey(null);
    setForm(emptyBusiness);
    persistBusinessDraft(emptyBusiness);
  };

  const handleSubmit = async () => {
    if (!form.companyName.trim()) return;

    try {
      setIsSaving(true);
      const normalized = normalizeBusinessProfile({
        ...form,
        updatedAt: new Date().toISOString(),
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
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not save business profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (business: BusinessRecord) => {
    setEditingBusinessKey(buildBusinessKey(business));
    setForm(normalizeBusinessProfile(business));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (business: BusinessRecord) => {
    if (!window.confirm(`Delete ${business.companyName || 'this business'}?`)) return;

    try {
      const key = buildBusinessKey(business);
      const next = businesses.filter((item) => buildBusinessKey(item) !== key);
      setBusinesses(next);
      persistBusinessLibrary(next);
      if (editingBusinessKey === key) resetForm();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete business.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1320px] space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Business List</h1>
            <p className="mt-2 text-[15px] text-slate-500">
              Save multiple business profiles here, then fetch them directly while creating invoices.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#2457F0] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1f49ce]"
          >
            <Plus className="h-4 w-4" />
            Add New Business
          </button>
        </div>

        <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">
                {editingBusinessKey ? 'Edit Business' : 'Create Business'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Invoice-ready details saved here will be available in the business flow.
              </p>
            </div>
            {editingBusinessKey ? (
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
            <BusinessField
              label="Business Name"
              value={form.companyName}
              onChange={(companyName) => setForm((current) => ({ ...current, companyName }))}
            />
            <BusinessField
              label="Email"
              type="email"
              value={form.email}
              onChange={(email) => setForm((current) => ({ ...current, email }))}
            />
            <BusinessField
              label="Phone No"
              value={form.phone}
              onChange={(phone) => setForm((current) => ({ ...current, phone }))}
            />
            <BusinessField
              label="Address"
              value={form.address}
              onChange={(address) => setForm((current) => ({ ...current, address }))}
            />
            <BusinessSelect
              label="Tax Type"
              value={form.taxType}
              onChange={(taxType) => setForm((current) => ({ ...current, taxType }))}
            />
            <BusinessField
              label="Tax ID"
              value={form.taxId}
              onChange={(taxId) => setForm((current) => ({ ...current, taxId }))}
            />
            <BusinessField
              label="Postal Code"
              value={form.zipCode}
              onChange={(zipCode) => setForm((current) => ({ ...current, zipCode }))}
            />
            <BusinessField
              label="City"
              value={form.city}
              onChange={(city) => setForm((current) => ({ ...current, city }))}
            />
            <BusinessField
              label="Country"
              value={form.country}
              onChange={(country) => setForm((current) => ({ ...current, country }))}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#2457F0] px-5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? 'Saving...' : editingBusinessKey ? 'Update Business' : 'Save Business'}
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
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Saved Businesses</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {businesses.length} business record{businesses.length === 1 ? '' : 's'} in your account
                </p>
              </div>
            </div>

            <div className="flex items-center rounded-[12px] border border-slate-200 bg-white px-4 py-3 shadow-sm md:w-[380px]">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search businesses..."
                className="w-full border-none bg-transparent text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              <Search className="h-5 w-5 shrink-0 text-slate-700" />
            </div>
          </div>

          <div className="md:hidden">
            {filteredBusinesses.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No businesses saved yet.</div>
            ) : (
              <div className="space-y-3 p-4">
                {filteredBusinesses.map((business) => {
                  const initials = (business.companyName || 'B').trim().charAt(0).toUpperCase();
                  return (
                    <article key={buildBusinessKey(business)} className="rounded-2xl border border-slate-200 bg-[#FBFCFF] p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF] text-sm font-bold text-[#2457F0]">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">{business.companyName || '-'}</div>
                            <div className="mt-1 truncate text-xs text-slate-500">
                              {[business.city, business.country].filter(Boolean).join(', ') || 'No location added'}
                            </div>
                          </div>
                        </div>
                        <BusinessActions business={business} onEdit={startEdit} onDelete={handleDelete} />
                      </div>

                      <dl className="mt-4 grid gap-2 text-sm">
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                          <dt className="text-slate-500">Email</dt>
                          <dd className="truncate font-medium text-slate-700">{business.email || '-'}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                          <dt className="text-slate-500">Phone</dt>
                          <dd className="truncate font-medium text-slate-700">{business.phone || '-'}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                          <dt className="text-slate-500">Address</dt>
                          <dd className="truncate text-right font-medium text-slate-700">
                            {[business.address, business.zipCode].filter(Boolean).join(', ') || '-'}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                          <dt className="text-slate-500">Added On</dt>
                          <dd className="truncate font-medium text-slate-700">{formatDate(business.updatedAt)}</dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[980px] w-full border-collapse text-left">
              <thead className="bg-[#FBFCFF]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                  <th className="px-5 py-4">Business</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Address</th>
                  <th className="px-5 py-4">Added On</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      No businesses saved yet.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((business) => {
                    const initials = (business.companyName || 'B').trim().charAt(0).toUpperCase();
                    return (
                      <tr key={buildBusinessKey(business)} className="border-t border-slate-200/70 text-[14px]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EEF3FF] text-sm font-bold text-[#2457F0]">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-slate-900">{business.companyName || '-'}</div>
                              <div className="mt-1 truncate text-xs text-slate-500">
                                {[business.city, business.country].filter(Boolean).join(', ') || 'No location added'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{business.email || '-'}</td>
                        <td className="px-5 py-4 text-slate-700">{business.phone || '-'}</td>
                        <td className="px-5 py-4 text-slate-700">
                          {[business.address, business.zipCode].filter(Boolean).join(', ') || '-'}
                        </td>
                        <td className="px-5 py-4 text-slate-700">{formatDate(business.updatedAt)}</td>
                        <td className="px-5 py-4">
                          <BusinessActions business={business} onEdit={startEdit} onDelete={handleDelete} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
