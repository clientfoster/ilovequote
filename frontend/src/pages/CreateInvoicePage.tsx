import React, { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  ImagePlus,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchUserQuotes } from '../quoteApi';
import { AUTH_STATE_EVENT, getScopedStorageKey, isAuthenticated } from '../auth';
import {
  formatInvoiceCurrency,
  getDiscountAmount,
  getInvoiceTotal,
  getLineItemAmount,
  getSubTotal,
  makeInvoiceExtraField,
  makeInvoiceLineItem,
  makeInvoiceTerm,
  type InvoiceDraft,
  useInvoiceDraft,
} from '../invoiceDraft';
import { BUSINESS_DRAFT_KEY, CLIENT_DRAFT_KEY } from '../wizard/WizardState';
import type { BusinessFormValues, ClientFormValues, Quote } from '../types';

const steps = [
  { number: '1', label: 'Invoice Details', active: true },
  { number: '2', label: 'Your Bank Details', active: false, optional: true },
  { number: '3', label: 'Select Design & Colors', active: false, subtitle: '(Download or Email Invoice)' },
];

const currencyOptions = ['INR (INR, Rs)', 'USD (USD, $)', 'EUR (EUR, €)', 'GBP (GBP, £)'];

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-xl font-black tracking-[-0.03em] text-slate-900">{title}</h3>
        {subtitle ? <span className="text-sm font-medium text-slate-500">{subtitle}</span> : null}
      </div>
      {children}
    </section>
  );
}

type ProfileOption = {
  id: string;
  label: string;
  patch: Partial<InvoiceDraft>;
};

function Field({
  label,
  value,
  onChange,
  type = 'text',
  icon,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
        />
        {icon}
      </div>
    </label>
  );
}

function ProfileSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ProfileOption[];
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex min-h-[46px] w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-[#2E6EAB]"
        >
          <option value="manual">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function BusinessDetailsFields({
  draft,
  updateDraft,
  isEditing,
  setIsEditing,
}: {
  draft: InvoiceDraft;
  updateDraft: (patch: Partial<InvoiceDraft>) => void;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${isEditing ? 'border-[#B7D4F0] ring-2 ring-[#EAF4FF]' : 'border-slate-200'}`}>
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2E6EAB]"
        >
          <Pencil className="h-4 w-4" />
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Business Name" value={draft.businessName} onChange={(businessName) => updateDraft({ businessName })} />
        <Field label="Email" value={draft.email} onChange={(email) => updateDraft({ email })} />
        <Field label="Phone No" value={draft.businessPhone} type="tel" required={false} onChange={(businessPhone) => updateDraft({ businessPhone })} />
        <Field label="Address" value={draft.businessAddress} onChange={(businessAddress) => updateDraft({ businessAddress })} />
        <Field label="GSTIN" value={draft.gstin} onChange={(gstin) => updateDraft({ gstin })} />
        <Field label="PAN" value={draft.pan} onChange={(pan) => updateDraft({ pan })} />
        <Field label="Postal" value={draft.businessPostal} onChange={(businessPostal) => updateDraft({ businessPostal })} />
        <Field label="City" value={draft.businessCity} onChange={(businessCity) => updateDraft({ businessCity })} />
        <Field label="Country" value={draft.businessCountry} onChange={(businessCountry) => updateDraft({ businessCountry })} />
      </div>
    </div>
  );
}

function ClientDetailsFields({
  draft,
  updateDraft,
}: {
  draft: InvoiceDraft;
  updateDraft: (patch: Partial<InvoiceDraft>) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Client Name" value={draft.clientName} onChange={(clientName) => updateDraft({ clientName })} />
        <Field label="Company Name" value={draft.billedToCompany} onChange={(billedToCompany) => updateDraft({ billedToCompany })} />
        <Field label="Phone No" value={draft.billedToPhone} type="tel" required={false} onChange={(billedToPhone) => updateDraft({ billedToPhone })} />
        <Field label="Client ID" value={draft.clientId} onChange={(clientId) => updateDraft({ clientId })} />
        <Field label="Address" value={draft.billedToAddress} onChange={(billedToAddress) => updateDraft({ billedToAddress })} />
        <Field label="City" value={draft.billedToCity} onChange={(billedToCity) => updateDraft({ billedToCity })} />
        <Field label="Country" value={draft.billedToCountry} onChange={(billedToCountry) => updateDraft({ billedToCountry })} />
        <Field label="Postal" value={draft.billedToPostal} onChange={(billedToPostal) => updateDraft({ billedToPostal })} />
        <Field label="PO Number" value={draft.subtitle} onChange={(subtitle) => updateDraft({ subtitle, showSubtitle: true })} />
        <Field label="Reference Number" value={draft.clientId} onChange={(clientId) => updateDraft({ clientId })} />
      </div>
    </div>
  );
}

function buildProfileKey(parts: Array<string | undefined | null>) {
  return parts
    .map((part) => part?.trim().toLowerCase() || '')
    .join('|');
}

function buildBusinessProfileOption(
  id: string,
  source: Partial<BusinessFormValues> & {
    companyName?: string;
    email?: string;
    address?: string;
    city?: string;
    country?: string;
    zipCode?: string;
    taxType?: string;
    taxId?: string;
  },
) {
  const label = [source.companyName || 'Business Profile', source.phone, source.email, source.city].filter(Boolean).join(' | ');
  const patch: Partial<InvoiceDraft> = {
    businessName: source.companyName?.trim() || '',
    email: source.email?.trim() || '',
    businessPhone: source.phone?.trim() || '',
    businessAddress: source.address?.trim() || '',
    businessCity: source.city?.trim() || '',
    businessCountry: source.country?.trim() || '',
    businessPostal: source.zipCode?.trim() || '',
    gstin: source.taxType === 'GSTIN' ? source.taxId?.trim() || '' : '',
    pan: source.taxType === 'PAN' ? source.taxId?.trim() || '' : '',
  };

  return {
    id,
    label,
    patch,
  } satisfies ProfileOption;
}

function buildClientProfileOption(
  id: string,
  source: Partial<ClientFormValues> & {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
  },
) {
  const label = [source.companyName || source.name || 'Client Profile', source.phone, source.email].filter(Boolean).join(' | ');
  const patch: Partial<InvoiceDraft> = {
    clientName: source.companyName?.trim() || source.contactPerson?.trim() || source.name?.trim() || '',
    clientId: source.poNumber?.trim() || source.taxId?.trim() || '',
    billedToCompany: source.companyName?.trim() || source.name?.trim() || '',
    billedToPhone: source.phone?.trim() || '',
    billedToAddress: source.billingAddress?.trim() || source.address?.trim() || '',
    billedToCity: source.city?.trim() || '',
    billedToCountry: source.country?.trim() || '',
    billedToPostal: source.zipCode?.trim() || '',
  };

  return {
    id,
    label,
    patch,
  } satisfies ProfileOption;
}

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useInvoiceDraft();
  const [isAuthed, setIsAuthed] = useState(isAuthenticated());
  const [isBusinessEditing, setIsBusinessEditing] = useState(true);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [businessProfiles, setBusinessProfiles] = useState<ProfileOption[]>([]);
  const [clientProfiles, setClientProfiles] = useState<ProfileOption[]>([]);
  const [selectedBusinessProfileId, setSelectedBusinessProfileId] = useState('manual');
  const [selectedClientProfileId, setSelectedClientProfileId] = useState('manual');
  const currencyMenuRef = useRef<HTMLDivElement | null>(null);

  const updateDraft = (patch: Partial<InvoiceDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const subtotal = getSubTotal(draft.lineItems);
  const discountAmount = getDiscountAmount(draft);
  const total = getInvoiceTotal(draft, draft.showTax);
  const lineItemGridClass = draft.showTax
    ? 'md:grid-cols-[54px_minmax(200px,1.4fr)_110px_120px_120px_130px_44px]'
    : 'md:grid-cols-[54px_minmax(200px,1.4fr)_110px_120px_130px_44px]';
  const optionalFieldsGridClass = draft.showDueDate && draft.showCustomFields ? 'grid gap-3 md:grid-cols-2 md:items-start' : 'grid gap-3';
  const updateBusinessDraft = (patch: Partial<InvoiceDraft>) => {
    setSelectedBusinessProfileId('manual');
    updateDraft(patch);
  };
  const updateClientDraft = (patch: Partial<InvoiceDraft>) => {
    setSelectedClientProfileId('manual');
    updateDraft(patch);
  };
  const updateCustomField = (id: string, patch: { label?: string; value?: string }) => {
    updateDraft({
      customFields: draft.customFields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    });
  };
  const addCustomField = () => {
    updateDraft({
      customFields: [...draft.customFields, makeInvoiceExtraField()],
      showCustomFields: true,
    });
  };
  const toggleCustomFields = () => {
    if (!draft.showCustomFields && draft.customFields.length === 0) {
      updateDraft({
        showCustomFields: true,
        customFields: [makeInvoiceExtraField()],
      });
      return;
    }

    updateDraft({ showCustomFields: !draft.showCustomFields });
  };
  const removeCustomField = (id: string) => {
    updateDraft({
      customFields: draft.customFields.filter((field) => field.id !== id),
    });
  };

  useEffect(() => {
    const syncAuth = () => setIsAuthed(isAuthenticated());
    syncAuth();

    window.addEventListener(AUTH_STATE_EVENT, syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener(AUTH_STATE_EVENT, syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfiles = async () => {
      if (!isAuthed) {
        if (!cancelled) {
          setBusinessProfiles([]);
          setClientProfiles([]);
          setSelectedBusinessProfileId('manual');
          setSelectedClientProfileId('manual');
        }
        return;
      }

      const nextBusinessProfiles: ProfileOption[] = [];
      const nextClientProfiles: ProfileOption[] = [];
      const seenBusinessKeys = new Set<string>();
      const seenClientKeys = new Set<string>();

      const pushBusinessProfile = (profile: ProfileOption, key: string) => {
        if (!key || seenBusinessKeys.has(key)) return;
        seenBusinessKeys.add(key);
        nextBusinessProfiles.push(profile);
      };

      const pushClientProfile = (profile: ProfileOption, key: string) => {
        if (!key || seenClientKeys.has(key)) return;
        seenClientKeys.add(key);
        nextClientProfiles.push(profile);
      };

      try {
        const businessDraftRaw = localStorage.getItem(getScopedStorageKey(BUSINESS_DRAFT_KEY));
        if (businessDraftRaw) {
          const parsed = JSON.parse(businessDraftRaw) as Partial<BusinessFormValues>;
          if (parsed.companyName?.trim()) {
            const profile = buildBusinessProfileOption('business-draft', parsed);
            pushBusinessProfile(
              profile,
              buildProfileKey([
                parsed.companyName,
                parsed.phone,
                parsed.email,
                parsed.address,
                parsed.city,
                parsed.country,
                parsed.zipCode,
              ]),
            );
          }
        }
      } catch {
        // Ignore malformed drafts and continue with quote history.
      }

      try {
        const clientDraftRaw = localStorage.getItem(getScopedStorageKey(CLIENT_DRAFT_KEY));
        if (clientDraftRaw) {
          const parsed = JSON.parse(clientDraftRaw) as Partial<ClientFormValues>;
          if (parsed.companyName?.trim() || parsed.contactPerson?.trim()) {
            const profile = buildClientProfileOption('client-draft', parsed);
            pushClientProfile(
              profile,
              buildProfileKey([
                parsed.companyName,
                parsed.contactPerson,
                parsed.email,
                parsed.phone,
                parsed.billingAddress,
                parsed.city,
                parsed.country,
              ]),
            );
          }
        }
      } catch {
        // Ignore malformed drafts and continue with quote history.
      }

      try {
        const quotes = await fetchUserQuotes();
        quotes.forEach((quote: Quote) => {
          const businessProfile = buildBusinessProfileOption(`quote-business-${quote.id}`, {
            companyName: quote.businessDetails.companyName,
            email: quote.businessDetails.email,
            address: quote.businessDetails.address,
            city: quote.businessDetails.city,
            country: quote.businessDetails.country,
            zipCode: quote.businessDetails.zipCode,
            taxType: quote.businessDetails.taxType,
            taxId: quote.businessDetails.taxId,
          });

          const clientProfile = buildClientProfileOption(`quote-client-${quote.id}`, {
            name: quote.clientDetails.name,
            email: quote.clientDetails.email,
            phone: quote.clientDetails.phone,
            address: quote.clientDetails.address,
          });

          if (quote.businessDetails.companyName?.trim()) {
            pushBusinessProfile(
              businessProfile,
              buildProfileKey([
                quote.businessDetails.companyName,
                quote.businessDetails.phone,
                quote.businessDetails.email,
                quote.businessDetails.address,
                quote.businessDetails.city,
                quote.businessDetails.country,
                quote.businessDetails.zipCode,
              ]),
            );
          }

          if (quote.clientDetails.name?.trim()) {
            pushClientProfile(
              clientProfile,
              buildProfileKey([
                quote.clientDetails.name,
                quote.clientDetails.email,
                quote.clientDetails.phone,
                quote.clientDetails.address,
              ]),
            );
          }
        });
      } catch {
        // Signed-in users can still work manually if quote history is unavailable.
      }

      if (!cancelled) {
        setBusinessProfiles(nextBusinessProfiles);
        setClientProfiles(nextClientProfiles);
      }
    };

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  useEffect(() => {
    if (!isCurrencyMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setIsCurrencyMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isCurrencyMenuOpen]);

  const applyBusinessProfile = (profileId: string) => {
    if (profileId === 'manual') {
      setSelectedBusinessProfileId('manual');
      return;
    }

    const selected = businessProfiles.find((profile) => profile.id === profileId);
    if (!selected) return;

    setSelectedBusinessProfileId(profileId);
    updateDraft(selected.patch);
  };

  const applyClientProfile = (profileId: string) => {
    if (profileId === 'manual') {
      setSelectedClientProfileId('manual');
      return;
    }

    const selected = clientProfiles.find((profile) => profile.id === profileId);
    if (!selected) return;

    setSelectedClientProfileId(profileId);
    updateDraft(selected.patch);
  };

  const startNewClient = () => {
    setSelectedClientProfileId('manual');
      updateDraft({
      clientName: '',
      clientId: '',
      billedToCompany: '',
      billedToPhone: '',
      billedToAddress: '',
      billedToCity: '',
      billedToCountry: '',
      billedToPostal: '',
    });
  };

  return (
    <div className="min-h-full bg-[#F8FAFF] px-3 py-4 md:px-5 md:py-6">
      <div className="mx-auto max-w-[1380px] space-y-4 md:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${step.active ? 'border-[#2E6EAB] bg-[#2E6EAB] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                    {step.number}
                  </div>
                  <div className="pt-0.5">
                    <div className={`text-sm font-bold ${step.active ? 'text-slate-900' : 'text-slate-600'}`}>{step.label}</div>
                    {'optional' in step && step.optional ? <div className="text-xs text-slate-400">(Optional)</div> : null}
                    {'subtitle' in step && step.subtitle ? <div className="text-xs text-slate-400">{step.subtitle}</div> : null}
                  </div>
                </div>
                {index < steps.length - 1 ? <ChevronRight className="hidden h-5 w-5 text-slate-300 lg:block" /> : null}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white px-4 py-5 shadow-sm md:px-8 md:py-7">
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-900">Invoice</h1>
              <button
                type="button"
                onClick={() => updateDraft({ showSubtitle: !draft.showSubtitle })}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#B7D4F0] bg-[#EAF4FF] px-3 py-1.5 text-sm font-semibold text-[#2E6EAB]"
              >
                <CirclePlus className="h-4 w-4" />
                {draft.showSubtitle ? 'Hide Sub Title' : 'Add Sub Title'}
              </button>
              {draft.showSubtitle ? (
                <div className="mx-auto mt-3 max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <input
                    value={draft.subtitle}
                    onChange={(event) => updateDraft({ subtitle: event.target.value })}
                    placeholder="Enter invoice subtitle"
                    className="w-full bg-transparent text-center text-sm font-medium text-slate-700 outline-none"
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_200px] xl:grid-cols-[minmax(0,1.7fr)_220px] lg:items-start">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Field label="Invoice No" value={draft.invoiceNumber} onChange={(invoiceNumber) => updateDraft({ invoiceNumber })} />
                    <p className="mt-2 text-sm font-semibold text-slate-400">Latest Invoice No: A00005 (Jan 17, 2024)</p>
                  </div>
                  <Field
                    label="Invoice Date"
                    value={draft.invoiceDate}
                    type="date"
                    onChange={(invoiceDate) => updateDraft({ invoiceDate })}
                    icon={<CalendarDays className="h-4 w-4 text-slate-400" />}
                  />
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => updateDraft({ showDueDate: !draft.showDueDate })}
                    className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]"
                  >
                    <CirclePlus className="h-4 w-4" />
                    {draft.showDueDate ? 'Hide Due Date' : 'Add Due Date'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleCustomFields}
                    className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]"
                  >
                    <CirclePlus className="h-4 w-4" />
                    {draft.showCustomFields ? 'Hide Extra Fields' : 'Add More Fields'}
                  </button>
                </div>
                {(draft.showDueDate || draft.showCustomFields) ? (
                  <div className={optionalFieldsGridClass}>
                    {draft.showDueDate ? (
                      <div className="self-start rounded-2xl border border-slate-200 bg-slate-50/70 px-2.5 py-2.5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                          <span className="text-sm font-semibold text-slate-700">Due Date</span>
                          <div className="flex min-h-[40px] w-full items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm sm:w-[260px] sm:max-w-[260px]">
                            <input
                              type="date"
                              value={draft.dueDate}
                              onChange={(event) => updateDraft({ dueDate: event.target.value })}
                              className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                            />
                            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {draft.showCustomFields ? (
                      <div className="self-start rounded-2xl border border-slate-200 bg-slate-50/70 px-2.5 py-2.5">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black tracking-[-0.02em] text-slate-900">Custom Fields</h4>
                            <p className="text-xs leading-4 text-slate-500">Add labels such as Client ID, GST Number, PO Number, or Vehicle No.</p>
                          </div>
                          <button
                            type="button"
                            onClick={addCustomField}
                            className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            <Plus className="h-4 w-4" />
                            Add Field
                          </button>
                        </div>

                        <div className="mt-2 space-y-1.5">
                          {draft.customFields.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2.5 text-center">
                              <p className="text-sm font-semibold text-slate-700">No custom fields yet</p>
                              <p className="mt-1 text-xs text-slate-500">Add your first field to start capturing extra invoice details.</p>
                            </div>
                          ) : (
                            draft.customFields.map((field) => (
                              <div key={field.id} className="grid gap-1.5 sm:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_48px] sm:items-center">
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(event) => updateCustomField(field.id, { label: event.target.value })}
                                  placeholder="Field label"
                                  className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-[#2E6EAB]"
                                />
                                <input
                                  type="text"
                                  value={field.value}
                                  onChange={(event) => updateCustomField(field.id, { value: event.target.value })}
                                  placeholder="Field value"
                                  className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-[#2E6EAB]"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomField(field.id)}
                                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white px-0 text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-500"
                                  aria-label="Delete custom field"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex items-start justify-center lg:justify-end">
                <label className="flex min-h-[104px] w-full max-w-[220px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#B7D4F0] bg-[#F4FAFF] px-4 text-sm font-semibold text-[#5D78A4]">
                  <ImagePlus className="h-5 w-5" />
                  {draft.logoName || 'Add Business Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => updateDraft({ logoName: event.target.files?.[0]?.name ?? '' })}
                  />
                </label>
              </div>

            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="Billed By" subtitle="(Your Details)">
                <div className="space-y-4">
                  {isAuthed && businessProfiles.length > 0 ? (
                    <ProfileSelect
                      label="Business Profile"
                      value={selectedBusinessProfileId}
                      onChange={applyBusinessProfile}
                      options={businessProfiles}
                      placeholder="Manual entry"
                    />
                  ) : null}

                  <BusinessDetailsFields
                    draft={draft}
                    updateDraft={updateBusinessDraft}
                    isEditing={isBusinessEditing}
                    setIsEditing={setIsBusinessEditing}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Billed To" subtitle="(Client Details)">
                <div className="space-y-4">
                  {isAuthed ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        {clientProfiles.length > 0 ? (
                          <ProfileSelect
                            label="Client Profile"
                            value={selectedClientProfileId}
                            onChange={applyClientProfile}
                            options={clientProfiles}
                            placeholder="Manual entry"
                          />
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                            No saved clients yet. Enter details below to keep working.
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={startNewClient}
                        className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#2E6EAB] px-4 text-sm font-bold text-white shadow-sm"
                      >
                        <CirclePlus className="h-4 w-4" />
                        Add New Client
                      </button>
                    </div>
                  ) : null}

                  <ClientDetailsFields draft={draft} updateDraft={updateClientDraft} />
                </div>
              </SectionCard>
            </div>

            <section className="space-y-3">
              <label className="inline-flex items-center gap-3 text-sm font-bold text-[#2E6EAB]">
                <input type="checkbox" checked={draft.shippingEnabled} onChange={(event) => updateDraft({ shippingEnabled: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-[#2E6EAB] focus:ring-[#2E6EAB]" />
                Add Shipping Details
              </label>
              {draft.shippingEnabled ? (
                <div className="grid gap-4 xl:grid-cols-3">
                  <SectionCard title="Shipped From">
                    <div className="space-y-3">
                      <Field label="Business / Freelancer Name" value={draft.businessName} onChange={(businessName) => updateDraft({ businessName })} />
                      <Field label="Country" value={draft.businessCountry} onChange={(businessCountry) => updateDraft({ businessCountry })} />
                      <Field label="Address" value={draft.businessAddress} onChange={(businessAddress) => updateDraft({ businessAddress })} />
                      <Field label="City" value={draft.businessCity} onChange={(businessCity) => updateDraft({ businessCity })} />
                      <Field label="Postal Code" value={draft.businessPostal} onChange={(businessPostal) => updateDraft({ businessPostal })} />
                    </div>
                  </SectionCard>
                  <SectionCard title="Shipped To">
                    <div className="space-y-3">
                      <Field label="Client Business Name" value={draft.billedToCompany} onChange={(billedToCompany) => updateDraft({ billedToCompany })} />
                      <Field label="Country" value={draft.billedToCountry} onChange={(billedToCountry) => updateDraft({ billedToCountry })} />
                      <Field label="Address" value={draft.billedToAddress} onChange={(billedToAddress) => updateDraft({ billedToAddress })} />
                      <Field label="City" value={draft.billedToCity} onChange={(billedToCity) => updateDraft({ billedToCity })} />
                      <Field label="Postal Code" value={draft.billedToPostal} onChange={(billedToPostal) => updateDraft({ billedToPostal })} />
                      <button
                        type="button"
                        onClick={() => updateDraft({ showShippingExtraFields: !draft.showShippingExtraFields })}
                        className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]"
                      >
                        <CirclePlus className="h-4 w-4" />
                        {draft.showShippingExtraFields ? 'Hide Extra Fields' : 'Add More Fields'}
                      </button>
                      {draft.showShippingExtraFields ? <Field label="State" value={draft.billedToCity} onChange={(billedToCity) => updateDraft({ billedToCity })} /> : null}
                    </div>
                  </SectionCard>
                </div>
              ) : null}
            </section>

            <div className="space-y-3">
              <label className="inline-flex items-center gap-3 text-sm font-bold text-[#2E6EAB]">
                <input
                  type="checkbox"
                  checked={draft.showTaxItemsSection}
                  onChange={(event) => updateDraft({ showTaxItemsSection: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#2E6EAB] focus:ring-[#2E6EAB]"
                />
                {draft.showTaxItemsSection ? 'Hide Tax & Items' : 'Show Tax & Items'}
              </label>

              {draft.showTaxItemsSection ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => updateDraft({ showTax: !draft.showTax })}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm"
                    >
                      Configure Tax
                    </button>
                    <div ref={currencyMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCurrencyMenuOpen((current) => !current)}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm"
                      >
                        {draft.currency === 'INR (INR, Rs)' ? 'Choose currency' : draft.currency}
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>
                      {isCurrencyMenuOpen ? (
                        <div className="absolute left-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                          {currencyOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                updateDraft({ currency: option });
                                setIsCurrencyMenuOpen(false);
                              }}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                                draft.currency === option ? 'bg-[#EAF4FF] text-[#2E6EAB]' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{option}</span>
                              {draft.currency === option ? <span className="text-xs font-black">✓</span> : null}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                    <div className={`hidden md:grid ${lineItemGridClass} gap-3 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500`}>
                      <div>#</div><div>Item / Description</div><div>Quantity</div><div>Rate</div>{draft.showTax ? <div>Tax (%)</div> : null}<div>Amount</div><div />
                    </div>
                    <div className="divide-y divide-slate-200">
                      {draft.lineItems.map((row, index) => {
                        const amount = getLineItemAmount(row, draft.showTax);
                        return (
                          <div key={row.id} className={`grid gap-3 px-4 py-4 ${lineItemGridClass} md:items-center`}>
                            <div className="text-sm font-bold text-slate-900">{index + 1}</div>
                            <div className="grid gap-2">
                              <input value={row.name} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, name: e.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none" />
                              <input value={row.description} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, description: e.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 outline-none" />
                            </div>
                            <input type="number" value={row.quantity} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, quantity: Number(e.target.value) || 0 } : item) }))} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none" />
                            <input type="number" value={row.rate} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, rate: Number(e.target.value) || 0 } : item) }))} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none" />
                            {draft.showTax ? (
                              <input type="number" value={row.tax} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, tax: Number(e.target.value) || 0 } : item) }))} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none" />
                            ) : null}
                            <div className="flex items-center text-sm font-bold text-slate-900">{formatInvoiceCurrency(amount)}</div>
                            <button onClick={() => setDraft((current) => ({ ...current, lineItems: current.lineItems.filter((item) => item.id !== row.id) }))} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid gap-4 border-t border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                      <button onClick={() => setDraft((current) => ({ ...current, lineItems: [...current.lineItems, makeInvoiceLineItem()] }))} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-dashed border-[#B7D4F0] bg-[#EAF4FF] px-4 text-sm font-bold text-[#2E6EAB]">
                        <Plus className="h-4 w-4" />
                        Add Item
                      </button>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between font-semibold text-slate-600"><span>Sub Total</span><span>{formatInvoiceCurrency(subtotal)}</span></div>
                          <div className="grid gap-2 sm:grid-cols-[1fr_82px_64px] sm:items-center">
                            <span className="font-semibold text-slate-600">Discount</span>
                            <input type="number" value={draft.discountValue} onChange={(e) => updateDraft({ discountValue: Number(e.target.value) || 0 })} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none" />
                            <select value={draft.discountType} onChange={(e) => updateDraft({ discountType: e.target.value as '%' | 'Flat' })} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none">
                              <option value="%">%</option>
                              <option value="Flat">Flat</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between font-semibold text-slate-600"><span /><span>(-) {formatInvoiceCurrency(discountAmount)}</span></div>
                            <div className="text-right text-3xl font-black tracking-[-0.04em] text-[#2E6EAB]">{formatInvoiceCurrency(total)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Add Notes', icon: <ReceiptText className="h-4 w-4" />, action: () => updateDraft({ notes: `${draft.notes}\nNew note` }) },
                { label: 'Add Attachments', icon: <Upload className="h-4 w-4" />, action: () => updateDraft({ notes: `${draft.notes}\nAttachment added.` }) },
                { label: 'Add Signature', icon: <Pencil className="h-4 w-4" />, action: () => updateDraft({ notes: `${draft.notes}\nSigned by authorised person.` }) },
              ].map((action) => (
                <button key={action.label} onClick={action.action} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#2E6EAB] shadow-sm">
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
              <SectionCard title="Terms and Conditions">
                <div className="space-y-4">
                  {draft.terms.map((term, index) => (
                    <div key={term.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                      <textarea
                        value={term.text}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            terms: current.terms.map((entry) => entry.id === term.id ? { ...entry, text: event.target.value } : entry),
                          }))
                        }
                        className="min-h-[60px] flex-1 resize-none bg-transparent text-sm font-medium leading-7 text-slate-700 outline-none"
                      />
                      <div className="flex items-center gap-2 pt-0.5 text-slate-400">
                        <button onClick={() => setDraft((current) => ({ ...current, terms: current.terms.filter((entry) => entry.id !== term.id) }))}><span className="text-lg">x</span></button>
                        <button><MoreVertical className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <button onClick={() => setDraft((current) => ({ ...current, terms: [...current.terms, makeInvoiceTerm()] }))} className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]">
                      <CirclePlus className="h-4 w-4" />
                      Add New Term
                    </button>
                  </div>
                </div>
              </SectionCard>

            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
              <button onClick={() => window.location.assign('#/dashboard')} className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 shadow-sm">Cancel</button>
                <div className="flex items-stretch rounded-xl bg-[#2E6EAB] shadow-[0_12px_24px_rgba(46,110,171,0.22)]">
                <button onClick={() => navigate('/create-invoice/bank-details')} className="inline-flex min-h-[50px] items-center justify-center px-8 text-sm font-bold text-white">Save & Continue</button>
                <button className="border-l border-[#5D8CC0] px-4 text-white"><ChevronDown className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
