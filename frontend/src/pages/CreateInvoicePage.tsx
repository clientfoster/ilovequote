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
  Search,
  X,
  Trash2,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createCustomer, fetchCustomers } from '../customerApi';
import { fetchUserQuotes } from '../quoteApi';
import { AUTH_STATE_EVENT, getScopedStorageKey, isAuthenticated } from '../auth';
import SearchableProfileSelect from '../components/SearchableProfileSelect';
import {
  formatInvoiceCurrency,
  getDiscountAmount,
  getInvoiceTotal,
  getLineItemAmount,
  getSubTotal,
  makeInvoiceExtraField,
  makeInvoiceLineItem,
  makeInvoiceTerm,
  type InvoiceAttachment,
  type InvoiceDraft,
  useInvoiceDraft,
} from '../invoiceDraft';
import { BUSINESS_LIBRARY_KEY, buildProfileKey } from '../profileAutofill';
import { BUSINESS_DRAFT_KEY, CLIENT_DRAFT_KEY } from '../wizard/WizardState';
import type { BusinessFormValues, ClientFormValues, Customer, Quote } from '../types';

const steps = [
  { number: '1', label: 'Invoice Details', active: true, path: '/create-invoice' },
  { number: '2', label: 'Your Bank Details', active: false, optional: true, path: '/create-invoice/bank-details' },
  { number: '3', label: 'Select Design & Colors', active: false, subtitle: '(Download or Email Invoice)', path: '/create-invoice/design' },
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
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
        <input
          ref={inputRef}
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function formatAttachmentSize(size: number) {
  if (!size) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function buildAttachmentEntry(file: File, dataUrl: string): InvoiceAttachment {
  return {
    id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl: file.type.startsWith('image/') ? dataUrl : '',
  };
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
  const [isMobileStepsOpen, setIsMobileStepsOpen] = useState(false);
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [showAttachmentsEditor, setShowAttachmentsEditor] = useState(false);
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const signatureNameRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const updateDraft = (patch: Partial<InvoiceDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const subtotal = getSubTotal(draft.lineItems);
  const discountAmount = getDiscountAmount(draft);
  const total = getInvoiceTotal(draft, draft.showTax);
  const lineItemGridClass = draft.showTax
    ? 'md:grid-cols-[54px_minmax(200px,1.4fr)_110px_120px_120px_130px_44px]'
    : 'md:grid-cols-[54px_minmax(200px,1.4fr)_110px_120px_130px_44px]';
  const shippingExtraFieldsVisible = draft.showShippingExtraFields || draft.showCustomFields || draft.showExtraFields;
  const updateBusinessDraft = (patch: Partial<InvoiceDraft>) => {
    setSelectedBusinessProfileId('manual');
    updateDraft(patch);
  };
  const updateClientDraft = (patch: Partial<InvoiceDraft>) => {
    setSelectedClientProfileId('manual');
    updateDraft(patch);
  };
  const handleLogoUpload = (file?: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateDraft({
        logoName: file.name,
        logoData: typeof reader.result === 'string' ? reader.result : '',
      });
    };
    reader.readAsDataURL(file);
  };
  const removeLogo = () => {
    updateDraft({
      logoName: '',
      logoData: '',
    });
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };
  const openNotesEditor = () => {
    setShowNotesEditor(true);
    setTimeout(() => notesTextareaRef.current?.focus(), 0);
  };
  const openAttachmentsEditor = () => {
    setShowAttachmentsEditor(true);
    attachmentInputRef.current?.click();
  };
  const handleAttachmentFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const nextAttachments = await Promise.all(
        Array.from(files).map(async (file) => {
          const dataUrl = file.type.startsWith('image/') ? await readFileAsDataUrl(file) : '';
          return buildAttachmentEntry(file, dataUrl);
        }),
      );

      setDraft((current) => ({
        ...current,
        attachments: [...current.attachments, ...nextAttachments],
      }));
      setShowAttachmentsEditor(true);
    } catch (error) {
      console.error('Failed to read attachment file', error);
      window.alert('Could not add attachment. Please try again.');
    }
  };
  const removeAttachment = (attachmentId: string) => {
    setDraft((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== attachmentId),
    }));
  };
  const openSignatureEditor = () => {
    setShowSignatureEditor(true);
    signatureInputRef.current?.click();
  };
  const handleSignatureUpload = async (file?: File | null) => {
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateDraft({
        signatureData: dataUrl,
      });
      setShowSignatureEditor(true);
      setTimeout(() => signatureNameRef.current?.focus(), 0);
    } catch (error) {
      console.error('Failed to read signature file', error);
      window.alert('Could not add signature. Please try again.');
    }
  };
  const clearSignature = () => {
    updateDraft({
      signatureName: '',
      signatureData: '',
    });
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
      showShippingExtraFields: true,
      showExtraFields: true,
    });
  };
  const toggleShippingExtraFields = () => {
    const nextVisible = !shippingExtraFieldsVisible;
    updateDraft({
      showCustomFields: nextVisible,
      showShippingExtraFields: nextVisible,
      showExtraFields: nextVisible,
      customFields: nextVisible && draft.customFields.length === 0 ? [makeInvoiceExtraField()] : draft.customFields,
    });
  };
  const removeCustomField = (id: string) => {
    updateDraft({
      customFields: draft.customFields.filter((field) => field.id !== id),
    });
  };
  const startNewBusiness = () => {
    setSelectedBusinessProfileId('manual');
    setIsBusinessEditing(true);
    updateDraft({
      businessName: '',
      email: '',
      businessPhone: '',
      businessAddress: '',
      businessCity: '',
      businessCountry: '',
      businessPostal: '',
      gstin: '',
      pan: '',
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
        const businessLibraryRaw = localStorage.getItem(getScopedStorageKey(BUSINESS_LIBRARY_KEY));
        if (businessLibraryRaw) {
          const parsed = JSON.parse(businessLibraryRaw) as Array<Partial<BusinessFormValues>>;
          parsed.forEach((entry, index) => {
            if (entry.companyName?.trim()) {
              pushBusinessProfile(
                buildBusinessProfileOption(`business-library-${index}`, entry),
                buildProfileKey([
                  entry.companyName,
                  entry.phone,
                  entry.email,
                  entry.address,
                  entry.city,
                  entry.country,
                  entry.zipCode,
                ]),
              );
            }
          });
        }
      } catch {
        // Ignore malformed business library data.
      }

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
        const savedCustomers = await fetchCustomers();
        savedCustomers.forEach((customer: Customer) => {
          const clientProfile = buildClientProfileOption(`customer-${customer.id}`, customer);
          const key = buildProfileKey([
            customer.companyName,
            customer.contactPerson,
            customer.email,
            customer.phone,
            customer.billingAddress,
            customer.city,
            customer.country,
          ]);
          if (customer.companyName?.trim() || customer.contactPerson?.trim()) {
            pushClientProfile(clientProfile, key);
          }
        });
      } catch {
        // Signed-in users can still work manually if customer history is unavailable.
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

  const handleSaveAndContinue = async () => {
    try {
      const businessDraft = {
        companyName: draft.businessName,
        tagline: '',
        email: draft.email,
        phone: draft.businessPhone,
        website: '',
        logo: '',
        address: draft.businessAddress,
        city: draft.businessCity,
        state: '',
        zipCode: draft.businessPostal,
        country: draft.businessCountry,
        taxType: draft.gstin ? 'GSTIN' : draft.pan ? 'PAN' : 'Other',
        taxId: draft.gstin || draft.pan,
        socialLinks: [],
        businessSlug: '',
      } satisfies BusinessFormValues;

      localStorage.setItem(getScopedStorageKey(BUSINESS_DRAFT_KEY), JSON.stringify(businessDraft));

      const existingBusinessLibraryRaw = localStorage.getItem(getScopedStorageKey(BUSINESS_LIBRARY_KEY));
      const existingBusinessLibrary = existingBusinessLibraryRaw ? (JSON.parse(existingBusinessLibraryRaw) as BusinessFormValues[]) : [];
      const nextBusinessLibrary = [businessDraft, ...existingBusinessLibrary].filter(
        (entry, index, array) =>
          entry.companyName.trim() &&
          array.findIndex((candidate) =>
            buildProfileKey([
              candidate.companyName,
              candidate.phone,
              candidate.email,
              candidate.address,
              candidate.city,
              candidate.country,
              candidate.zipCode,
            ]) ===
            buildProfileKey([
              entry.companyName,
              entry.phone,
              entry.email,
              entry.address,
              entry.city,
              entry.country,
              entry.zipCode,
            ]),
          ) === index,
      );
      localStorage.setItem(getScopedStorageKey(BUSINESS_LIBRARY_KEY), JSON.stringify(nextBusinessLibrary));

      const clientDraft = {
        companyName: draft.billedToCompany,
        contactPerson: draft.clientName,
        email: '',
        phone: draft.billedToPhone,
        website: '',
        taxIdType: 'GSTIN',
        taxId: draft.clientId,
        poNumber: draft.subtitle,
        billingAddress: draft.billedToAddress,
        city: draft.billedToCity,
        state: '',
        zipCode: draft.billedToPostal,
        country: draft.billedToCountry,
      } satisfies ClientFormValues;
      localStorage.setItem(getScopedStorageKey(CLIENT_DRAFT_KEY), JSON.stringify(clientDraft));

      const hasManualClientDetails = selectedClientProfileId === 'manual' && (draft.billedToCompany.trim() || draft.clientName.trim());
      if (isAuthed && hasManualClientDetails) {
        const duplicateExists = clientProfiles.some((profile) =>
          buildProfileKey([
            profile.patch.billedToCompany,
            profile.patch.clientName,
            profile.patch.billedToPhone,
            profile.patch.billedToAddress,
            profile.patch.billedToCity,
            profile.patch.billedToCountry,
            profile.patch.billedToPostal,
          ]) ===
          buildProfileKey([
            draft.billedToCompany,
            draft.clientName,
            draft.billedToPhone,
            draft.billedToAddress,
            draft.billedToCity,
            draft.billedToCountry,
            draft.billedToPostal,
          ]),
        );

        if (!duplicateExists) {
          await createCustomer({
            companyName: draft.billedToCompany,
            contactPerson: draft.clientName,
            email: '',
            phone: draft.billedToPhone,
            website: '',
            taxIdType: 'GSTIN',
            taxId: draft.clientId,
            poNumber: draft.subtitle,
            billingAddress: draft.billedToAddress,
            city: draft.billedToCity,
            state: '',
            zipCode: draft.billedToPostal,
            country: draft.billedToCountry,
          });
        }
      }
    } catch {
      // Keep the flow usable even if background profile persistence fails.
    }

    navigate('/create-invoice/bank-details');
  };

  return (
    <div className="min-h-full bg-[#F8FAFF] px-3 py-4 md:px-5 md:py-6">
      <div className="mx-auto max-w-[1380px] space-y-4 md:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm md:px-6 md:py-4">
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileStepsOpen((current) => !current)}
              className="flex w-full items-center gap-3"
              aria-expanded={isMobileStepsOpen}
              aria-label="Toggle invoice steps"
            >
              {steps.filter((step) => step.active).map((step) => (
                <React.Fragment key={step.number}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black ${step.active ? 'border-[#2E6EAB] bg-[#2E6EAB] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                    {step.number}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-slate-900">{step.label}</div>
                    {'optional' in step && step.optional ? <div className="text-[11px] font-medium text-slate-400 sm:hidden">Optional</div> : null}
                    {'subtitle' in step && step.subtitle ? <div className="hidden text-[11px] font-medium text-slate-400 sm:block">{step.subtitle}</div> : null}
                  </div>
                  <ChevronDown className={`ml-auto h-4 w-4 text-slate-400 transition-transform duration-200 ${isMobileStepsOpen ? 'rotate-180' : ''}`} />
                </React.Fragment>
              ))}
            </button>
            {isMobileStepsOpen ? (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {steps.map((step) => (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      setIsMobileStepsOpen(false);
                      navigate(step.path);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${step.active ? 'bg-[#EEF4FF]' : 'bg-transparent'}`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${step.active ? 'border-[#2E6EAB] bg-[#2E6EAB] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                      {step.number}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-bold ${step.active ? 'text-[#1D4ED8]' : 'text-slate-700'}`}>{step.label}</div>
                      {'optional' in step && step.optional ? <div className="text-[10px] font-medium text-slate-400">Optional</div> : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="hidden flex-col gap-4 md:flex lg:flex-row lg:items-center lg:justify-center">
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
            <div className="pt-1 text-center md:pt-0">
              <h1 className="text-[3rem] font-black leading-none tracking-[-0.04em] text-slate-900 md:text-4xl">Invoice</h1>
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
                  <div className="md:max-w-[420px]">
                    <Field label="Invoice No" value={draft.invoiceNumber} onChange={(invoiceNumber) => updateDraft({ invoiceNumber })} />
                    <p className="mt-2 text-sm font-semibold text-slate-400">Latest Invoice No: A00005 (Jan 17, 2024)</p>
                  </div>
                  <div className="md:max-w-[420px]">
                    <Field
                      label="Invoice Date"
                      value={draft.invoiceDate}
                      type="date"
                      onChange={(invoiceDate) => updateDraft({ invoiceDate })}
                      icon={<CalendarDays className="h-4 w-4 text-slate-400" />}
                    />
                  </div>
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
                </div>
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
              </div>

              <div className="flex items-start justify-center lg:justify-end">
                <div className="relative w-full max-w-[220px]">
                  {draft.logoData ? (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove logo"
                      title="Remove logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                  <label className="flex min-h-[104px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#B7D4F0] bg-[#F4FAFF] px-3 text-sm font-semibold text-[#5D78A4]">
                  {draft.logoData ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
                        <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-white/80 p-2 shadow-sm">
                          <img src={draft.logoData} alt="Business logo preview" className="max-h-full max-w-full object-contain" />
                        </div>
                        <span className="w-full truncate text-[11px] font-semibold text-slate-600">{draft.logoName}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <ImagePlus className="h-5 w-5" />
                        <span>{draft.logoName || 'Add Business Logo'}</span>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleLogoUpload(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>

            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Billed By" subtitle="(Your Details)">
                <div className="space-y-4">
                  {isAuthed ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <SearchableProfileSelect
                          label="Search Business"
                          value={selectedBusinessProfileId}
                          onChange={applyBusinessProfile}
                          options={businessProfiles}
                          placeholder="Search by business name"
                          emptyMessage="No matching business found."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={startNewBusiness}
                        className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
                      >
                        <CirclePlus className="h-4 w-4" />
                        Add New Business
                      </button>
                    </div>
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
                        <SearchableProfileSelect
                          label="Search Client"
                          value={selectedClientProfileId}
                          onChange={applyClientProfile}
                          options={clientProfiles}
                          placeholder="Search by client name"
                          emptyMessage="No matching client found."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={startNewClient}
                          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
                        >
                          <CirclePlus className="h-4 w-4" />
                          Add New Client
                        </button>
                      </div>
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
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-3">
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
                          onClick={toggleShippingExtraFields}
                          className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]"
                        >
                          <CirclePlus className="h-4 w-4" />
                          {shippingExtraFieldsVisible ? 'Hide Extra Fields' : 'Add More Fields'}
                        </button>
                        {shippingExtraFieldsVisible ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
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
                    </SectionCard>
                  </div>
                </div>
              ) : null}
            </section>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-3 text-sm font-bold text-[#2E6EAB]">
                  <input
                    type="checkbox"
                    checked={draft.showTax}
                    onChange={(event) => updateDraft({ showTax: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-[#2E6EAB] focus:ring-[#2E6EAB]"
                  />
                  {draft.showTax ? 'Hide Tax' : 'Show Tax'}
                </label>

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
                          {draft.currency === option ? <span className="text-xs font-black">v</span> : null}
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
                              <input
                                value={row.name}
                                onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, name: e.target.value } : item) }))}
                                placeholder="Enter item name"
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400"
                              />
                              <input
                                value={row.description}
                                onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, description: e.target.value } : item) }))}
                                placeholder="Enter description"
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none placeholder:text-slate-400"
                              />
                            </div>
                            <input
                              type="number"
                              value={row.quantity || ''}
                              onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, quantity: Number(e.target.value) || 0 } : item) }))}
                              placeholder="Qty"
                              className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                            />
                            <input
                              type="number"
                              value={row.rate || ''}
                              onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, rate: Number(e.target.value) || 0 } : item) }))}
                              placeholder="Enter rate"
                              className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                            />
                            {draft.showTax ? (
                              <input
                                type="number"
                                value={row.tax || ''}
                                onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, tax: Number(e.target.value) || 0 } : item) }))}
                                placeholder="Tax %"
                                className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                              />
                            ) : null}
                            <div className="flex items-center text-sm font-bold text-slate-900">{formatInvoiceCurrency(amount)}</div>
                            <button
                              type="button"
                              disabled={draft.lineItems.length === 1}
                              onClick={() => {
                                if (draft.lineItems.length === 1) return;
                                setDraft((current) => ({
                                  ...current,
                                  lineItems: current.lineItems.filter((item) => item.id !== row.id),
                                }));
                              }}
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                              aria-label={draft.lineItems.length === 1 ? 'At least one item is required' : 'Delete line item'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid gap-4 border-t border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                      <button type="button" onClick={() => setDraft((current) => ({ ...current, lineItems: [...current.lineItems, makeInvoiceLineItem()] }))} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-dashed border-[#B7D4F0] bg-[#EAF4FF] px-4 text-sm font-bold text-[#2E6EAB]">
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
                </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => (showNotesEditor ? setShowNotesEditor(false) : openNotesEditor())}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#2E6EAB] shadow-sm"
              >
                <ReceiptText className="h-4 w-4" />
                {showNotesEditor ? 'Hide Notes' : 'Add Notes'}
              </button>
              <button
                type="button"
                onClick={() => (showAttachmentsEditor ? setShowAttachmentsEditor(false) : openAttachmentsEditor())}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#2E6EAB] shadow-sm"
              >
                <Upload className="h-4 w-4" />
                {showAttachmentsEditor ? 'Hide Attachments' : 'Add Attachments'}
              </button>
              <button
                type="button"
                onClick={() => (showSignatureEditor ? setShowSignatureEditor(false) : openSignatureEditor())}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#2E6EAB] shadow-sm"
              >
                <Pencil className="h-4 w-4" />
                {showSignatureEditor ? 'Hide Signature' : 'Add Signature'}
              </button>
            </div>

            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleAttachmentFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void handleSignatureUpload(event.target.files?.[0] ?? null);
                event.target.value = '';
              }}
            />

            {showNotesEditor || showAttachmentsEditor || showSignatureEditor ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {showNotesEditor ? (
                  <SectionCard title="Notes" subtitle="(Optional)">
                    <div className="space-y-3">
                      <textarea
                        ref={notesTextareaRef}
                        value={draft.notes}
                        onChange={(event) => updateDraft({ notes: event.target.value })}
                        placeholder="Enter notes"
                        className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-7 text-slate-700 outline-none focus:border-[#2E6EAB]"
                      />
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setShowNotesEditor(false)}
                          className="text-sm font-bold text-slate-500 transition hover:text-slate-700"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  </SectionCard>
                ) : null}

                {showAttachmentsEditor ? (
                  <SectionCard title="Attachments" subtitle="(Optional)">
                    <div className="space-y-3">
                      <p className="text-sm leading-6 text-slate-500">
                        Add supporting files such as receipts, reference docs, or images.
                      </p>
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-dashed border-[#B7D4F0] bg-[#EAF4FF] px-4 text-sm font-bold text-[#2E6EAB]"
                      >
                        <Upload className="h-4 w-4" />
                        Add More Files
                      </button>
                      <div className="space-y-2">
                        {draft.attachments.length > 0 ? (
                          draft.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 text-slate-400">
                                {attachment.dataUrl ? (
                                  <img src={attachment.dataUrl} alt={attachment.name} className="h-full w-full object-cover" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-slate-800">{attachment.name}</div>
                                <div className="text-xs text-slate-500">{formatAttachmentSize(attachment.size)}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(attachment.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                aria-label={`Remove ${attachment.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-center">
                            <p className="text-sm font-semibold text-slate-700">No attachments yet</p>
                            <p className="mt-1 text-xs text-slate-500">Use the button above to upload files for this invoice.</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAttachmentsEditor(false)}
                          className="text-sm font-bold text-slate-500 transition hover:text-slate-700"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  </SectionCard>
                ) : null}

                {showSignatureEditor ? (
                  <SectionCard title="Signature" subtitle="(Optional)">
                    <div className="space-y-3">
                      <Field
                        label="Signer Name"
                        value={draft.signatureName}
                        required={false}
                        inputRef={signatureNameRef}
                        onChange={(signatureName) => updateDraft({ signatureName })}
                      />
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4">
                        {draft.signatureData ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white p-3 shadow-sm">
                              <img src={draft.signatureData} alt="Signature preview" className="max-h-28 max-w-full object-contain" />
                            </div>
                            <p className="text-center text-xs text-slate-500">Signature image uploaded</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-center text-slate-500">
                            <ImagePlus className="h-5 w-5" />
                            <p className="text-sm font-semibold">Upload a signature image</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => signatureInputRef.current?.click()}
                          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
                        >
                          <Upload className="h-4 w-4" />
                          {draft.signatureData ? 'Replace Signature' : 'Upload Signature'}
                        </button>
                        {draft.signatureData || draft.signatureName ? (
                          <button
                            type="button"
                            onClick={clearSignature}
                            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setShowSignatureEditor(false)}
                          className="text-sm font-bold text-slate-500 transition hover:text-slate-700"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  </SectionCard>
                ) : null}
              </div>
            ) : null}

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
                <button onClick={() => void handleSaveAndContinue()} className="inline-flex min-h-[50px] items-center justify-center px-8 text-sm font-bold text-white">Save & Continue</button>
                <button className="border-l border-[#5D8CC0] px-4 text-white"><ChevronDown className="h-4 w-4" /></button>
              </div>
            </div>
                </div>
              </section>
              </div>
    </div>
  );
}

