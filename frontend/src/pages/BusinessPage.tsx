import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Building2,
  CheckCircle2,
  CirclePlus,
  Pencil,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import BusinessForm from '../modules/business-module/components/BusinessForm';
import { getScopedStorageKey } from '../auth';
import { BusinessFormValues } from '../types';
import { DEFAULT_BUSINESS_VALUES, BUSINESS_DRAFT_KEY } from '../wizard/WizardState';

const BUSINESS_LIBRARY_KEY = 'ilovequote_invoice_business_library';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeBusinessProfile(profile: Partial<BusinessFormValues> = {}): BusinessFormValues {
  return {
    ...DEFAULT_BUSINESS_VALUES,
    ...profile,
    socialLinks: Array.isArray(profile.socialLinks) ? profile.socialLinks : [],
    phone: profile.phone || '',
    tagline: profile.tagline || '',
    website: profile.website || '',
    logo: profile.logo || '',
    address: profile.address || '',
    city: profile.city || '',
    state: profile.state || '',
    zipCode: profile.zipCode || '',
    country: profile.country || '',
    taxType: profile.taxType || DEFAULT_BUSINESS_VALUES.taxType,
    taxId: profile.taxId || '',
    businessSlug: profile.businessSlug || '',
  };
}

function buildBusinessProfileKey(profile: Partial<BusinessFormValues>) {
  return [
    profile.companyName,
    profile.phone,
    profile.email,
    profile.address,
    profile.city,
    profile.state,
    profile.country,
    profile.zipCode,
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

export default function BusinessPage() {
  const [savedBusinesses, setSavedBusinesses] = useState<BusinessFormValues[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProfileKey, setActiveProfileKey] = useState('manual');
  const [statusMessage, setStatusMessage] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessFormValues>({
    defaultValues: loadBusinessDraft(),
    mode: 'onChange',
  });

  const currentValues = watch();
  const previewAddress = [currentValues.address, currentValues.city, currentValues.state, currentValues.zipCode, currentValues.country]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    const loadState = () => {
      const library = loadBusinessLibrary();
      setSavedBusinesses(library);

      const draft = loadBusinessDraft();
      reset(draft);
      setActiveProfileKey(draft.companyName ? buildBusinessProfileKey(draft) : 'manual');
    };

    loadState();

    const handleStorage = () => loadState();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [reset]);

  useEffect(() => {
    const normalized = normalizeBusinessProfile(currentValues);
    persistBusinessDraft(normalized);

    if (activeProfileKey !== 'manual' && buildBusinessProfileKey(normalized) !== activeProfileKey) {
      setActiveProfileKey('manual');
    }
  }, [activeProfileKey, currentValues]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const filteredBusinesses = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return savedBusinesses.filter((profile) => {
      if (!needle) return true;
      const haystack = [
        profile.companyName,
        profile.phone,
        profile.email,
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
    setActiveProfileKey('manual');
    persistBusinessDraft(DEFAULT_BUSINESS_VALUES);
    setStatusMessage('Started a new business profile.');
  };

  const handleSaveBusiness = (values: BusinessFormValues) => {
    const normalized = normalizeBusinessProfile(values);
    const profileKey = buildBusinessProfileKey(normalized);
    const existingLibrary = loadBusinessLibrary();
    const nextLibrary = [normalized, ...existingLibrary.filter((entry) => buildBusinessProfileKey(entry) !== profileKey)];

    persistBusinessLibrary(nextLibrary);
    persistBusinessDraft(normalized);
    setSavedBusinesses(nextLibrary);
    setActiveProfileKey(profileKey);
    setStatusMessage(`Saved ${normalized.companyName || 'business profile'}. It will appear in the invoice search dropdown.`);
  };

  const handleLoadBusiness = (profile: BusinessFormValues) => {
    const normalized = normalizeBusinessProfile(profile);
    reset(normalized);
    persistBusinessDraft(normalized);
    setActiveProfileKey(buildBusinessProfileKey(normalized));
    setStatusMessage(`Loaded ${normalized.companyName || 'business profile'} into the editor.`);
  };

  const handleDeleteBusiness = (profile: BusinessFormValues) => {
    const profileKey = buildBusinessProfileKey(profile);
    if (!window.confirm(`Delete ${profile.companyName || 'this business profile'}?`)) return;

    const nextLibrary = loadBusinessLibrary().filter((entry) => buildBusinessProfileKey(entry) !== profileKey);
    persistBusinessLibrary(nextLibrary);
    setSavedBusinesses(nextLibrary);

    if (activeProfileKey === profileKey) {
      reset(DEFAULT_BUSINESS_VALUES);
      setActiveProfileKey('manual');
      persistBusinessDraft(DEFAULT_BUSINESS_VALUES);
    }

    setStatusMessage('Business profile deleted.');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">
        <section className="rounded-[18px] border border-slate-200 bg-white px-5 py-5 shadow-sm md:px-6 md:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2457F0]">
                <Sparkles className="h-3.5 w-3.5" />
                Business Profiles
              </div>
              <div>
                <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Invoice Business Profiles</h1>
                <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
                  Add and store multiple business records here for invoices. Saved profiles are imported automatically
                  into the invoice <span className="font-semibold text-slate-700">Search Business</span> dropdown.
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
          <form onSubmit={handleSubmit(handleSaveBusiness)} className="space-y-6">
            <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">Business Editor</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Create or update a profile. The current draft is also used as the invoice default.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleNewBusiness}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
                  >
                    <CirclePlus className="h-4 w-4" />
                    New Business
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#2457F0] px-5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Building2 className="h-4 w-4" />
                    {isSubmitting ? 'Saving...' : 'Save Business'}
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <BusinessForm
                  register={register}
                  control={control}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              </div>
            </section>
          </form>

          <aside className="space-y-6 xl:sticky xl:top-6">
            <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Live Preview</h2>
                  <p className="mt-1 text-sm text-slate-500">What the selected or current business will fill in the invoice Billed By section.</p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2457F0]">
                  {activeProfileKey === 'manual' ? 'Draft' : 'Selected'}
                </div>
              </div>

              <div className="mt-5 rounded-[18px] border border-slate-200 bg-[#F8FAFC] p-5">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Business Name</p>
                    <p className="mt-1 break-words text-[20px] font-black tracking-tight text-slate-900">
                      {currentValues.companyName || 'Your Business'}
                    </p>
                    {currentValues.tagline ? <p className="mt-2 text-sm text-slate-500">{currentValues.tagline}</p> : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p className="mt-1 break-all font-semibold">{currentValues.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Phone No</p>
                    <p className="mt-1 break-words font-semibold">{currentValues.phone || '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Address</p>
                    <p className="mt-1 whitespace-pre-line font-semibold">{previewAddress || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tax Type</p>
                    <p className="mt-1 font-semibold">{currentValues.taxType || 'GSTIN'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tax ID</p>
                    <p className="mt-1 break-all font-semibold">{currentValues.taxId || '-'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
                <div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Saved Businesses</h2>
                  <p className="mt-1 text-sm text-slate-500">{savedBusinesses.length} profile{savedBusinesses.length === 1 ? '' : 's'} ready for invoice import</p>
                </div>

                <div className="flex items-center rounded-[12px] border border-slate-200 bg-white px-4 py-3 shadow-sm md:w-[260px]">
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

              <div className="space-y-3 p-5 md:p-6">
                {filteredBusinesses.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">No saved businesses yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Save your first business profile above and it will show up in the invoice search box.
                    </p>
                  </div>
                ) : (
                  filteredBusinesses.map((business) => {
                    const profileKey = buildBusinessProfileKey(business);
                    const isActive = activeProfileKey === profileKey;
                    return (
                      <div
                        key={profileKey}
                        className={`rounded-[16px] border p-4 shadow-sm transition ${
                          isActive ? 'border-[#B7D4F0] bg-[#F4FAFF]' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {business.companyName || 'Untitled Business'}
                              </p>
                              {isActive ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                                  Active
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {business.email || 'No email'}{business.phone ? ` - ${business.phone}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-1 text-xs text-slate-600">
                          {business.address ? <p className="whitespace-pre-line">{business.address}</p> : null}
                          <p>{[business.city, business.state, business.country, business.zipCode].filter(Boolean).join(', ')}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadBusiness(business)}
                            className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBusiness(business)}
                            className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-700 shadow-sm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
