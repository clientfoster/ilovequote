import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, LoaderCircle, Moon, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BusinessStep from '../modules/business-module/BusinessModule';
import ClientStep from '../modules/client-module/ClientModule';
import ItemsWorkspace from '../modules/items-module/ItemsModule';
import PreviewStep from '../modules/preview-module/PreviewModule';
import StepWizard from '../components/StepWizard';
import BrandMark from '../components/BrandMark';
import { INITIAL_ITEMS } from '../itemData';
import { calculateQuotationTotals } from '../itemUtils';
import { BusinessFormValues, ClientFormValues, ItemQuoteItem, ItemQuotationMeta } from '../types';
import {
  DEFAULT_BUSINESS_VALUES,
  DEFAULT_CLIENT_VALUES,
  DEFAULT_ITEM_META,
  DEFAULT_SETTINGS,
  BUSINESS_DRAFT_KEY as BUSINESS_DRAFT_KEY_BASE,
  CLIENT_DRAFT_KEY as CLIENT_DRAFT_KEY_BASE,
  CLIENT_LOGO_KEY as CLIENT_LOGO_KEY_BASE,
  EDITING_QUOTE_ID_KEY as EDITING_QUOTE_ID_KEY_BASE,
  ITEMS_DRAFT_KEY as ITEMS_DRAFT_KEY_BASE,
  ITEMS_META_KEY as ITEMS_META_KEY_BASE,
  SETTINGS_STORAGE_KEY as SETTINGS_STORAGE_KEY_BASE,
} from './WizardState';
import { TermItem } from '../modules/items-module/components/TermsAndConditions';
import { getDisplayAuthUser, getScopedStorageKey } from '../auth';
import { downloadElementAsPdf } from '../download';
import { createQuote, updateQuote } from '../quoteApi';

const parseTermsStringToList = (termsStr: string): TermItem[] => {
  if (!termsStr) return [];
  return termsStr
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, idx) => ({
      id: `term-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      text: line.replace(/^\d+[\.\)]\s*/, ''),
    }));
};

const toLegacyQuoteItems = (items: ItemQuoteItem[]) =>
  items.map((item) => ({
    id: item.id,
    description: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    total: item.price,
  }));

const normalizeClientDraft = (draft: Partial<ClientFormValues> | null | undefined): ClientFormValues => {
  return { ...DEFAULT_CLIENT_VALUES, ...(draft ?? {}) };
};

const buildQuotePayload = (
  businessDetails: BusinessFormValues,
  clientDetails: ClientFormValues,
  clientLogo: string | null,
  items: ItemQuoteItem[],
  quotationMeta: ItemQuotationMeta,
  taxRate: number,
  terms: string,
  quoteId?: string | null,
) => {
  const totals = calculateQuotationTotals(items);
  return {
    id: quoteId || `quote-${Date.now()}`,
    quoteNumber: quotationMeta.quotationNumber,
    date: quotationMeta.date,
    expiryDate: quotationMeta.validUntil,
    status: 'Draft' as const,
    businessDetails,
    clientDetails: {
      name: clientDetails.companyName,
      email: clientDetails.email,
      phone: clientDetails.phone,
      address: clientDetails.billingAddress,
    },
    clientLogo: clientLogo || '',
    items: toLegacyQuoteItems(items),
    subtotal: totals.subtotal,
    taxRate,
    taxAmount: totals.gstTotal,
    totalAmount: totals.grandTotal,
    terms,
  };
};

export default function QuoteWizard() {
  const navigate = useNavigate();
  const { displayName, initials } = getDisplayAuthUser();
  const BUSINESS_DRAFT_KEY = getScopedStorageKey(BUSINESS_DRAFT_KEY_BASE);
  const CLIENT_DRAFT_KEY = getScopedStorageKey(CLIENT_DRAFT_KEY_BASE);
  const CLIENT_LOGO_KEY = getScopedStorageKey(CLIENT_LOGO_KEY_BASE);
  const EDITING_QUOTE_ID_KEY = getScopedStorageKey(EDITING_QUOTE_ID_KEY_BASE);
  const ITEMS_DRAFT_KEY = getScopedStorageKey(ITEMS_DRAFT_KEY_BASE);
  const ITEMS_META_KEY = getScopedStorageKey(ITEMS_META_KEY_BASE);
  const SETTINGS_STORAGE_KEY = getScopedStorageKey(SETTINGS_STORAGE_KEY_BASE);
  const TERMS_STORAGE_KEY = getScopedStorageKey('ilovequote_draft_terms_list');
  const outletContext = useOutletContext<{
    onTriggerToast: (message: string) => void;
    setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void;
  } | null>();
  const onTriggerToast = outletContext?.onTriggerToast ?? (() => {});
  const setSaveStatus = outletContext?.setSaveStatus ?? (() => {});

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [businessData, setBusinessData] = useState<BusinessFormValues>(DEFAULT_BUSINESS_VALUES);
  const [clientData, setClientData] = useState<ClientFormValues>(DEFAULT_CLIENT_VALUES);
  const [itemsData, setItemsData] = useState<ItemQuoteItem[]>(INITIAL_ITEMS);
  const [quotationMeta, setQuotationMeta] = useState<ItemQuotationMeta>(DEFAULT_ITEM_META);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(18);
  const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_SETTINGS.defaultTerms);
  const [termsList, setTermsList] = useState<TermItem[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const {
    register: registerClient,
    handleSubmit: handleClientSubmit,
    watch: watchClient,
    setValue: setClientValue,
    formState: { errors: clientErrors },
    reset: resetClient,
  } = useForm<ClientFormValues>({ defaultValues: DEFAULT_CLIENT_VALUES, mode: 'onChange' });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
    trigger,
  } = useForm<BusinessFormValues>({ defaultValues: DEFAULT_BUSINESS_VALUES, mode: 'onChange' });

  const watchedBusinessValues = watch();
  const watchedClientValues = watchClient();

  useEffect(() => {
    try {
      // Check for shared quote state in URL query string (handle HashRouter by looking at hash too)
      const hash = window.location.hash;
      const queryIdx = hash.indexOf('?');
      const queryString = queryIdx !== -1 ? hash.substring(queryIdx) : window.location.search;
      const searchParams = new URLSearchParams(queryString);
      const sharedDataRaw = searchParams.get('data');
      if (sharedDataRaw) {
        try {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(sharedDataRaw))));
          const sharedBusiness = {
            ...DEFAULT_BUSINESS_VALUES,
            companyName: decoded.businessName || '',
            email: decoded.businessEmail || '',
            phone: decoded.businessPhone || '',
            website: decoded.businessWebsite || '',
            logo: decoded.businessLogo || '',
          };
          const sharedClient = {
            ...DEFAULT_CLIENT_VALUES,
            companyName: decoded.clientName || '',
            contactPerson: decoded.clientContactPerson || '',
            email: decoded.clientEmail || '',
            phone: decoded.clientPhone || '',
          };

          reset(sharedBusiness);
          setBusinessData(sharedBusiness);

          resetClient(sharedClient);
          setClientData(sharedClient);
          setLogoUrl(decoded.clientLogo || null);

          if (Array.isArray(decoded.items)) {
            setItemsData(decoded.items);
          }

          setQuotationMeta({
            ...DEFAULT_ITEM_META,
            quotationNumber: decoded.quoteNumber || DEFAULT_ITEM_META.quotationNumber,
            date: decoded.issueDate || DEFAULT_ITEM_META.date,
            validUntil: decoded.expiryDate || DEFAULT_ITEM_META.validUntil,
          });

          if (decoded.terms) {
            setTermsAndConditions(decoded.terms);
            setTermsList(parseTermsStringToList(decoded.terms));
          }

          setCurrentStep(4);
          onTriggerToast('Loaded shared quotation details successfully!');
          return; // Skip reading local drafts when loading shared data
        } catch (e) {
          console.error("Failed to parse shared quote data", e);
        }
      }

      const settingsRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings = settingsRaw ? JSON.parse(settingsRaw) : DEFAULT_SETTINGS;
      setTaxRate(settings.defaultGstPercent || 18);
      
      const initialTerms = settings.defaultTerms || DEFAULT_SETTINGS.defaultTerms;
      setTermsAndConditions(initialTerms);

      const draftTerms = localStorage.getItem(TERMS_STORAGE_KEY);
      if (draftTerms) {
        setTermsList(JSON.parse(draftTerms));
      } else {
        setTermsList(parseTermsStringToList(initialTerms));
      }

      const storedLogo = localStorage.getItem(CLIENT_LOGO_KEY);
      if (storedLogo) setLogoUrl(storedLogo);

      const businessDraft = localStorage.getItem(BUSINESS_DRAFT_KEY);
      if (businessDraft) {
        const parsed = JSON.parse(businessDraft);
        reset({ ...DEFAULT_BUSINESS_VALUES, ...parsed });
        setBusinessData({ ...DEFAULT_BUSINESS_VALUES, ...parsed });
      }

      const clientDraft = localStorage.getItem(CLIENT_DRAFT_KEY);
      if (clientDraft) {
        const parsed = JSON.parse(clientDraft);
        const normalizedClient = normalizeClientDraft(parsed);
        resetClient(normalizedClient);
        setClientData(normalizedClient);
      }

      const itemsDraft = localStorage.getItem(ITEMS_DRAFT_KEY);
      if (itemsDraft) {
        const parsed = JSON.parse(itemsDraft);
        if (Array.isArray(parsed) && parsed.length > 0) setItemsData(parsed);
      }

      const metaDraft = localStorage.getItem(ITEMS_META_KEY);
      if (metaDraft) {
        const parsed = JSON.parse(metaDraft);
        setQuotationMeta({ ...DEFAULT_ITEM_META, ...parsed });
      }

      const storedEditingQuoteId = localStorage.getItem(EDITING_QUOTE_ID_KEY);
      if (storedEditingQuoteId) {
        setEditingQuoteId(storedEditingQuoteId);
      }
    } catch {
      // keep defaults
    }
  }, [reset, resetClient]);

  useEffect(() => {
    const formattedTermsStr = termsList
      .map((t) => t.text)
      .filter((text) => text.trim() !== '')
      .map((text, idx) => `${idx + 1}. ${text}`)
      .join('\n');
    setTermsAndConditions(formattedTermsStr);
  }, [termsList]);

  useEffect(() => {
    setSaveState('saving');
    setSaveStatus('saving');

    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(BUSINESS_DRAFT_KEY, JSON.stringify(watchedBusinessValues));
        localStorage.setItem(CLIENT_DRAFT_KEY, JSON.stringify(watchedClientValues));
        localStorage.setItem(ITEMS_DRAFT_KEY, JSON.stringify(itemsData));
        localStorage.setItem(ITEMS_META_KEY, JSON.stringify(quotationMeta));
        localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(termsList));
        if (logoUrl) {
          localStorage.setItem(CLIENT_LOGO_KEY, logoUrl);
        } else {
          localStorage.removeItem(CLIENT_LOGO_KEY);
        }
        if (editingQuoteId) {
          localStorage.setItem(EDITING_QUOTE_ID_KEY, editingQuoteId);
        } else {
          localStorage.removeItem(EDITING_QUOTE_ID_KEY);
        }
        setBusinessData(watchedBusinessValues);
        setClientData(watchedClientValues);
        setSaveState('saved');
        setSaveStatus('saved');
      } catch {
        setSaveState('idle');
        setSaveStatus('idle');
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [watchedBusinessValues, watchedClientValues, itemsData, quotationMeta, logoUrl, termsList, editingQuoteId, setSaveStatus]);

  useEffect(() => {
    setQuotationMeta((current) => ({
      ...current,
      businessName: watchedBusinessValues.companyName || current.businessName,
      businessEmail: watchedBusinessValues.email || current.businessEmail,
      clientName: watchedClientValues.companyName || current.clientName,
      clientEmail: watchedClientValues.email || current.clientEmail,
    }));
  }, [watchedBusinessValues.companyName, watchedBusinessValues.email, watchedClientValues.companyName, watchedClientValues.email]);

  const handleReset = () => {
    setBusinessData(DEFAULT_BUSINESS_VALUES);
    setClientData(DEFAULT_CLIENT_VALUES);
    setItemsData(INITIAL_ITEMS);
    setQuotationMeta(DEFAULT_ITEM_META);
    setLogoUrl(null);
    setTaxRate(DEFAULT_SETTINGS.defaultGstPercent);
    setTermsAndConditions(DEFAULT_SETTINGS.defaultTerms);
    setTermsList(parseTermsStringToList(DEFAULT_SETTINGS.defaultTerms));
    reset(DEFAULT_BUSINESS_VALUES);
    resetClient(DEFAULT_CLIENT_VALUES);
    localStorage.removeItem(BUSINESS_DRAFT_KEY);
    localStorage.removeItem(CLIENT_DRAFT_KEY);
    localStorage.removeItem(CLIENT_LOGO_KEY);
    localStorage.removeItem(ITEMS_DRAFT_KEY);
    localStorage.removeItem(ITEMS_META_KEY);
    localStorage.removeItem(TERMS_STORAGE_KEY);
    localStorage.removeItem(EDITING_QUOTE_ID_KEY);
    setEditingQuoteId(null);
    setSaveState('idle');
    onTriggerToast('Draft reset');
  };

  const handleStepBack = () => setCurrentStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));

  const handleBackOrHome = () => {
    if (currentStep === 1) {
      navigate('/dashboard');
      return;
    }

    handleStepBack();
  };

  const buildCurrentPayload = () =>
    buildQuotePayload(
      watchedBusinessValues,
      watchedClientValues,
      logoUrl,
      itemsData,
      quotationMeta,
      taxRate,
      termsAndConditions,
      editingQuoteId,
    );

  const saveQuoteToApi = async (payload: ReturnType<typeof buildQuotePayload>) => {
    if (editingQuoteId) {
      const response = await updateQuote(editingQuoteId, {
        ...payload,
        id: editingQuoteId,
        status: 'Draft',
      });
      return response.quote;
    }

    const response = await createQuote(payload);
    return response.quote;
  };

  const handleSaveDraft = () => {
    if (isSavingDraft) return;
    const payload = buildCurrentPayload();

    const persistDraftLocally = () => {
      try {
        localStorage.setItem(BUSINESS_DRAFT_KEY, JSON.stringify(watchedBusinessValues));
        localStorage.setItem(CLIENT_DRAFT_KEY, JSON.stringify(watchedClientValues));
        localStorage.setItem(ITEMS_DRAFT_KEY, JSON.stringify(itemsData));
        localStorage.setItem(ITEMS_META_KEY, JSON.stringify(quotationMeta));
        localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(termsList));
        if (logoUrl) {
          localStorage.setItem(CLIENT_LOGO_KEY, logoUrl);
        } else {
          localStorage.removeItem(CLIENT_LOGO_KEY);
        }
        if (editingQuoteId) {
          localStorage.setItem(EDITING_QUOTE_ID_KEY, editingQuoteId);
        }
      } catch {
        // local backup only
      }
    };

    setSaveState('saving');
    setSaveStatus('saving');
    setIsSavingDraft(true);

    saveQuoteToApi(payload)
      .then((savedQuote) => {
        setEditingQuoteId(savedQuote.id);
        localStorage.setItem(EDITING_QUOTE_ID_KEY, savedQuote.id);
        persistDraftLocally();
        setSaveState('saved');
        setSaveStatus('saved');
        onTriggerToast('Draft saved successfully');
      })
      .catch(() => {
        persistDraftLocally();
        setSaveState('idle');
        setSaveStatus('idle');
        onTriggerToast('Draft saved locally');
      })
      .finally(() => {
        setIsSavingDraft(false);
      });
  };

  const handleStepNext = () => setCurrentStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));

  const handlePrimaryAction = async () => {
    if (currentStep === 1) {
      const valid = await trigger('companyName');
      if (!valid) {
        onTriggerToast('Business Name is required to continue');
        return;
      }
      handleStepNext();
      return;
    }

    if (currentStep === 2) {
      handleStepNext();
      return;
    }

    if (currentStep === 3) {
      if (itemsData.length === 0) {
        onTriggerToast('Add at least one line item before previewing.');
        return;
      }
      handleStepNext();
      return;
    }

    try {
      const payload = buildCurrentPayload();
      const savedQuote = await saveQuoteToApi(payload);
      setEditingQuoteId(savedQuote.id);
      localStorage.setItem(EDITING_QUOTE_ID_KEY, savedQuote.id);
      onTriggerToast('Quote saved successfully');
      navigate('/quotes');
    } catch {
      setSaveState('idle');
      onTriggerToast('Could not save quote.');
    }
  };

  const handleDownloadPreviewPdf = async () => {
    const element = document.getElementById('invoice-capture-area') as HTMLElement | null;
    if (!element) {
      throw new Error('Preview area not found.');
    }

    await downloadElementAsPdf(element, `${quotationMeta.quotationNumber || 'quote'}.pdf`);
  };

  return (
    <div className="quote-wizard-shell min-h-dvh overflow-x-hidden bg-slate-50 text-slate-900">
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur md:relative md:z-30">
        <div className="mx-auto hidden max-w-7xl items-center justify-between gap-4 px-4 py-3 md:flex md:px-8 md:py-4">
          <div className="flex min-w-0 items-center gap-4">
            <BrandMark />
            <div className="h-10 w-px bg-slate-200" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-extrabold leading-none text-slate-900">Create Quote</h1>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                  Draft Mode
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Build, style, and send quotation bills in less than 2 minutes.</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              className="inline-flex h-11 min-h-[44px] w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Theme toggle"
            >
              <Moon size={18} />
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex h-11 min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex h-11 min-h-[44px] items-center gap-2 rounded-xl bg-[#2F5BFF] px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-[#244ad9]"
            >
              <span>{currentStep === 4 ? 'Next: Preview' : currentStep === 3 ? 'Next: Preview' : currentStep === 2 ? 'Next: Add Items' : 'Next: Add Client'}</span>
              <ChevronRight size={16} />
            </button>

            <div className="flex items-center gap-3 pl-1">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-extrabold text-xs">{initials}</div>
              <div className="hidden xl:block">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-slate-700">{displayName}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="md:hidden inline-flex h-11 min-h-[44px] w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            aria-label="Save draft"
            title="Save draft"
          >
            <Save size={16} />
          </button>
        </div>

        <div className="md:hidden px-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[22px] font-extrabold leading-tight text-slate-900">Create Quote</h1>
              <p className="mt-1 text-[14px] leading-5 text-slate-500">
                Build, style, and send quotation bills in less than 2 minutes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex h-11 min-h-[44px] w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
              aria-label="Save draft"
              title="Save draft"
            >
              <Save size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-2 pb-28 md:px-8 md:py-6">
        <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
          <StepWizard currentStep={currentStep} onStepClick={(step) => setCurrentStep(step as 1 | 2 | 3 | 4)} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mt-6">
              {currentStep === 1 && (
                <BusinessStep
                  register={register}
                  control={control}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  businessValues={watchedBusinessValues}
                  clientValues={watchedClientValues}
                  onNext={handleStepNext}
                  onBack={handleBackOrHome}
                  onScrollToSection={() => {}}
                  onOpenMobilePreview={() => {}}
                  showFooterNavigation={true}
                />
              )}

              {currentStep === 2 && (
                <ClientStep
                  register={registerClient}
                  errors={clientErrors}
                  setValue={setClientValue}
                  logoUrl={logoUrl}
                  formData={watchedClientValues}
                  onLogoChange={setLogoUrl}
                  onSubmit={handleClientSubmit(() => handleStepNext())}
                  onBack={() => setCurrentStep(1)}
                  onNext={handleStepNext}
                  onTriggerToast={onTriggerToast}
                  showFooterNavigation={true}
                />
              )}

              {currentStep === 3 && (
                <ItemsWorkspace
                  items={itemsData}
                  meta={quotationMeta}
                  onBack={() => setCurrentStep(2)}
                  onNext={handleStepNext}
                  onTriggerToast={onTriggerToast}
                  onItemsChange={setItemsData}
                  showFooterNavigation={true}
                  terms={termsList}
                  onTermsChange={setTermsList}
                />
              )}

              {currentStep === 4 && (
                <PreviewStep
                  businessName={watchedBusinessValues.companyName}
                  businessEmail={watchedBusinessValues.email}
                  businessPhone={watchedBusinessValues.phone}
                  businessWebsite={watchedBusinessValues.website}
                  businessAddress={[
                    watchedBusinessValues.address,
                    watchedBusinessValues.city,
                    watchedBusinessValues.state,
                    watchedBusinessValues.zipCode,
                    watchedBusinessValues.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  businessLogo={watchedBusinessValues.logo}
                  clientLogo={logoUrl}
                  businessSlug={watchedBusinessValues.businessSlug}
                  clientName={watchedClientValues.companyName}
                  clientContactPerson={watchedClientValues.contactPerson}
                  clientEmail={watchedClientValues.email}
                  clientPhone={watchedClientValues.phone}
                  clientAddress={watchedClientValues.billingAddress}
                  quoteNumber={quotationMeta.quotationNumber}
                  issueDate={quotationMeta.date}
                  expiryDate={quotationMeta.validUntil}
                  items={itemsData}
                  terms={termsAndConditions}
                  remarks={`Prepared for ${watchedClientValues.companyName || 'your client'} by ${watchedBusinessValues.companyName || 'your business'}.`}
                  onSaveDraft={handleSaveDraft}
                  onCopyLink={() => onTriggerToast('Share link copied to clipboard.')}
                  onPrint={() => onTriggerToast('Print is disabled. Use Download instead.')}
                  onDownloadPDF={handleDownloadPreviewPdf}
                  onSendToClient={async () => onTriggerToast('Preview send action completed.')}
                  onPrev={() => setCurrentStep(3)}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="no-print md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/96 backdrop-blur pb-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBackOrHome}
            className="inline-flex min-h-[44px] flex-[0.95] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700 shadow-sm"
          >
            <ChevronLeft size={16} />
            <span>{currentStep === 1 ? 'Home' : 'Back'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex h-11 min-h-[44px] w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            aria-label="Save draft"
            title="Save draft"
          >
            <Save size={16} />
          </button>

          <button
            type="button"
            onClick={handlePrimaryAction}
            className="inline-flex min-h-[44px] flex-[1.35] items-center justify-center gap-2 rounded-2xl bg-[#2F5BFF] px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-100"
          >
            <span>{currentStep === 4 ? 'Finalize' : 'Next'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
