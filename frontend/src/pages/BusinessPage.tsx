import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useOutletContext } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { getScopedStorageKey } from '../auth';
import { BusinessFormValues } from '../types';
import { BUSINESS_DRAFT_KEY, DEFAULT_BUSINESS_VALUES } from '../wizard/WizardState';

const BUSINESS_LIBRARY_KEY = 'ilovequote_invoice_business_library';

type OutletContext = {
  onTriggerToast?: (message: string) => void;
};

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeBusinessProfile(profile: Partial<BusinessFormValues> = {}): BusinessFormValues {
  return {
    ...DEFAULT_BUSINESS_VALUES,
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
    country: profile.country || DEFAULT_BUSINESS_VALUES.country || '',
    taxType: profile.taxType || DEFAULT_BUSINESS_VALUES.taxType,
    taxId: profile.taxId || '',
    socialLinks: [],
    businessSlug: '',
  };
}

function buildBusinessProfileKey(profile: Partial<BusinessFormValues>) {
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
  if (!canUseLocalStorage()) return [] as BusinessFormValues[];

  try {
    const raw = localStorage.getItem(getScopedStorageKey(BUSINESS_LIBRARY_KEY));
    const parsed = raw ? (JSON.parse(raw) as Partial<BusinessFormValues>[]) : [];
    return Array.isArray(parsed) ? parsed.map((profile) => normalizeBusinessProfile(profile)) : [];
  } catch {
    return [];
  }
}

function loadBusinessDraft() {
  if (!canUseLocalStorage()) return DEFAULT_BUSINESS_VALUES;

  try {
    const raw = localStorage.getItem(getScopedStorageKey(BUSINESS_DRAFT_KEY));
    if (!raw) return DEFAULT_BUSINESS_VALUES;
    return normalizeBusinessProfile(JSON.parse(raw) as Partial<BusinessFormValues>);
  } catch {
    return DEFAULT_BUSINESS_VALUES;
  }
}

function persistBusinessLibrary(profiles: BusinessFormValues[]) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(getScopedStorageKey(BUSINESS_LIBRARY_KEY), JSON.stringify(profiles));
}

function persistBusinessDraft(profile: BusinessFormValues) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(getScopedStorageKey(BUSINESS_DRAFT_KEY), JSON.stringify(profile));
}

function formatTaxValue(profile: Partial<BusinessFormValues>) {
  const taxId = profile.taxId?.trim();
  if (!taxId) return 'Not added';
  return `${profile.taxType || 'GSTIN'}: ${taxId}`;
}

function formatLocation(profile: Partial<BusinessFormValues>) {
  return [profile.city, profile.zipCode, profile.country].filter(Boolean).join(', ') || 'Not added';
}

export default function BusinessPage() {
  const context = useOutletContext<OutletContext>();
  const onTriggerToast = context?.onTriggerToast ?? (() => {});

  const [savedBusinesses, setSavedBusinesses] = useState<BusinessFormValues[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProfileKey, setEditingProfileKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [hasHydrated, setHasHydrated] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessFormValues>({
    defaultValues: loadBusinessDraft(),
    mode: 'onChange',
  });

  const currentValues = watch();

  useEffect(() => {
    const loadState = () => {
      const library = loadBusinessLibrary();
      setSavedBusinesses(library);

      const draft = loadBusinessDraft();
      reset(draft);
      setEditingProfileKey(draft.companyName ? buildBusinessProfileKey(draft) : null);
      setHasHydrated(true);
    };

    loadState();

    const handleStorage = () => loadState();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [reset]);

  useEffect(() => {
    if (!hasHydrated) return;

    const normalized = normalizeBusinessProfile(currentValues);
    persistBusinessDraft(normalized);
  }, [currentValues, hasHydrated]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const filteredBusinesses = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return savedBusinesses.filter((profile) => {
      if (!needle) return true;
      const haystack = [
        profile.companyName,
        profile.email,
        profile.phone,
        profile.address,
        profile.city,
        profile.country,
        profile.taxId,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [savedBusinesses, searchQuery]);

  const handleNewBusiness = () => {
    reset(DEFAULT_BUSINESS_VALUES);
    setEditingProfileKey(null);
    persistBusinessDraft(DEFAULT_BUSINESS_VALUES);
    setStatusMessage('Started a new business profile.');
  };

  const handleSaveBusiness = (values: BusinessFormValues) => {
    const normalized = normalizeBusinessProfile(values);
    const profileKey = buildBusinessProfileKey(normalized);
    const existingLibrary = loadBusinessLibrary();
    const nextLibrary = [normalized, ...existingLibrary.filter((entry) => {
      const existingKey = buildBusinessProfileKey(entry);
      return existingKey !== profileKey && existingKey !== editingProfileKey;
    })];

    persistBusinessLibrary(nextLibrary);
    persistBusinessDraft(normalized);
    setSavedBusinesses(nextLibrary);
    setEditingProfileKey(profileKey);
    setStatusMessage(`${normalized.companyName || 'Business profile'} saved for invoice use.`);
    onTriggerToast(`${normalized.companyName || 'Business profile'} saved.`);
  };

  const handleLoadBusiness = (profile: BusinessFormValues) => {
    const normalized = normalizeBusinessProfile(profile);
    reset(normalized);
    persistBusinessDraft(normalized);
    setEditingProfileKey(buildBusinessProfileKey(normalized));
    setStatusMessage(`Loaded ${normalized.companyName || 'business profile'} into the editor.`);
    onTriggerToast(`Loaded ${normalized.companyName || 'business profile'}.`);
  };

  const handleDeleteBusiness = (profile: BusinessFormValues) => {
    const profileKey = buildBusinessProfileKey(profile);
    if (!window.confirm(`Delete ${profile.companyName || 'this business profile'}?`)) return;

    const nextLibrary = loadBusinessLibrary().filter((entry) => buildBusinessProfileKey(entry) !== profileKey);
    persistBusinessLibrary(nextLibrary);
    setSavedBusinesses(nextLibrary);

    if (editingProfileKey === profileKey) {
      reset(DEFAULT_BUSINESS_VALUES);
      setEditingProfileKey(null);
      persistBusinessDraft(DEFAULT_BUSINESS_VALUES);
    }

    setStatusMessage('Business profile deleted.');
    onTriggerToast('Business profile deleted.');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">
        <section className="rounded-[18px] border border-slate-200 bg-white px-5 py-5 shadow-sm md:px-6 md:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2457F0]">
                <Sparkles className="h-3.5 w-3.5" />
                Invoice Business Profiles
              </div>
              <div>
                <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">My Business</h1>
                <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
                  Save your own business details here. These profiles are used later in the invoice
                  <span className="font-semibold text-slate-700"> Billed By</span> section.
                </p>
              </div>
            </div>

            {statusMessage ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {statusMessage}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">
                {editingProfileKey ? 'Edit Business Details' : 'Create Business Details'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep only the invoice-ready fields your Billed By section needs.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleNewBusiness}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                New Business
              </button>
              <button
                type="button"
                onClick={handleSubmit(handleSaveBusiness)}
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#2457F0] px-5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Business'}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Building2 className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Enter business name"
                  {...register('companyName', {
                    required: 'Business name is required.',
                  })}
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition-colors focus:ring-4 focus:ring-blue-100 ${
                    errors.companyName
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#2563EB]'
                  }`}
                />
              </div>
              {errors.companyName && (
                <p className="text-xs font-bold text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Email</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Phone No</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Address</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-3 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <textarea
                  placeholder="Street, area, building, landmark"
                  rows={3}
                  {...register('address')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Tax Type</label>
              <select
                {...register('taxType')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              >
                <option value="GSTIN">GSTIN</option>
                <option value="PAN">PAN</option>
                <option value="VAT">VAT</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Tax ID</label>
              <input
                type="text"
                placeholder="Enter tax number"
                {...register('taxId')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Postal</label>
              <input
                type="text"
                placeholder="560001"
                {...register('zipCode')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">City</label>
              <input
                type="text"
                placeholder="City"
                {...register('city')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Country</label>
              <input
                type="text"
                placeholder="India"
                {...register('country')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium leading-relaxed text-slate-500">
              These details are saved for reuse in the invoice Billed By section.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleNewBusiness}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleSubmit(handleSaveBusiness)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                Save Business
              </button>
            </div>
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
                  {savedBusinesses.length} business record{savedBusinesses.length === 1 ? '' : 's'} in your account
                </p>
              </div>
            </div>

            <div className="flex items-center rounded-[12px] border border-slate-200 bg-white px-4 py-3 shadow-sm md:w-[420px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search businesses..."
                className="w-full border-none bg-transparent text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              <Search className="h-5 w-5 shrink-0 text-slate-700" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left">
              <thead className="bg-[#FBFCFF]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                  <th className="px-5 py-4">Business</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Address</th>
                  <th className="px-5 py-4">Tax</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      {searchQuery ? 'No businesses match your search.' : 'No businesses saved yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((profile) => (
                    <tr key={buildBusinessProfileKey(profile)} className="border-t border-slate-200/70 text-[14px]">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {profile.companyName || '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-700">{profile.email || '-'}</td>
                      <td className="px-5 py-4 text-slate-700">{profile.phone || '-'}</td>
                      <td className="px-5 py-4 text-slate-700">
                        {[profile.address, profile.city, profile.country].filter(Boolean).join(', ') || '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-700">{formatTaxValue(profile)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadBusiness(profile)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
                            title="Edit business"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBusiness(profile)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-red-500 shadow-sm"
                            title="Delete business"
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
