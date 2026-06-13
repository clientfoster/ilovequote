import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Save } from 'lucide-react';
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
  BUSINESS_DRAFT_KEY,
  CLIENT_DRAFT_KEY,
  CLIENT_LOGO_KEY,
  ITEMS_DRAFT_KEY,
  ITEMS_META_KEY,
  QUOTES_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from './WizardState';

const toLegacyQuoteItems = (items: ItemQuoteItem[]) =>
  items.map((item) => ({
    id: item.id,
    description: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    total: item.price,
  }));

const stripHeavyBusinessFields = (business: BusinessFormValues): BusinessFormValues => ({
  ...business,
  logo: '',
  socialLinks: business.socialLinks.map((link) => ({ ...link })),
});

const buildQuotePayload = (
  businessDetails: BusinessFormValues,
  clientDetails: ClientFormValues,
  items: ItemQuoteItem[],
  quotationMeta: ItemQuotationMeta,
  taxRate: number,
  terms: string,
) => {
  const totals = calculateQuotationTotals(items);
  return {
    id: `quote-${Date.now()}`,
    quoteNumber: quotationMeta.quotationNumber,
    date: quotationMeta.date,
    expiryDate: quotationMeta.validUntil,
    status: 'Draft' as const,
    businessDetails: stripHeavyBusinessFields(businessDetails),
    clientDetails: {
      name: clientDetails.companyName,
      email: clientDetails.email,
      phone: clientDetails.phone,
      address: clientDetails.billingAddress,
    },
    items: toLegacyQuoteItems(items),
    subtotal: totals.subtotal,
    taxRate,
    taxAmount: totals.gstTotal,
    totalAmount: totals.grandTotal,
    terms,
  };
};

const saveQuotesSafely = (key: string, nextQuote: ReturnType<typeof buildQuotePayload>) => {
  const fallbackSizes = [undefined, 20, 10, 5, 1] as const;
  const existingRaw = localStorage.getItem(key);
  let existing: ReturnType<typeof buildQuotePayload>[] = [];

  try {
    existing = existingRaw ? JSON.parse(existingRaw) : [];
  } catch {
    existing = [];
  }

  const nextQuotes = [nextQuote, ...existing.filter((quote) => quote.quoteNumber !== nextQuote.quoteNumber)];

  for (const limit of fallbackSizes) {
    try {
      const candidate = typeof limit === 'number' ? nextQuotes.slice(0, limit) : nextQuotes;
      localStorage.setItem(key, JSON.stringify(candidate));
      return true;
    } catch {
      // try a smaller payload/list
    }
  }

  return false;
};

export default function QuoteWizard() {
  const navigate = useNavigate();
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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved');

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
      const settingsRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings = settingsRaw ? JSON.parse(settingsRaw) : DEFAULT_SETTINGS;
      setTaxRate(settings.defaultGstPercent || 18);
      setTermsAndConditions(settings.defaultTerms || DEFAULT_SETTINGS.defaultTerms);

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
        resetClient({ ...DEFAULT_CLIENT_VALUES, ...parsed });
        setClientData({ ...DEFAULT_CLIENT_VALUES, ...parsed });
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
    } catch {
      // keep defaults
    }
  }, [reset, resetClient]);

  useEffect(() => {
    setSaveState('saving');
    setSaveStatus('saving');

    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(BUSINESS_DRAFT_KEY, JSON.stringify(watchedBusinessValues));
        localStorage.setItem(CLIENT_DRAFT_KEY, JSON.stringify(watchedClientValues));
        localStorage.setItem(ITEMS_DRAFT_KEY, JSON.stringify(itemsData));
        localStorage.setItem(ITEMS_META_KEY, JSON.stringify(quotationMeta));
        if (logoUrl) localStorage.setItem(CLIENT_LOGO_KEY, logoUrl);
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
  }, [watchedBusinessValues, watchedClientValues, itemsData, quotationMeta, logoUrl, setSaveStatus]);

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
    reset(DEFAULT_BUSINESS_VALUES);
    resetClient(DEFAULT_CLIENT_VALUES);
    localStorage.removeItem(BUSINESS_DRAFT_KEY);
    localStorage.removeItem(CLIENT_DRAFT_KEY);
    localStorage.removeItem(CLIENT_LOGO_KEY);
    localStorage.removeItem(ITEMS_DRAFT_KEY);
    localStorage.removeItem(ITEMS_META_KEY);
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

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(BUSINESS_DRAFT_KEY, JSON.stringify(watchedBusinessValues));
      localStorage.setItem(CLIENT_DRAFT_KEY, JSON.stringify(watchedClientValues));
      localStorage.setItem(ITEMS_DRAFT_KEY, JSON.stringify(itemsData));
      localStorage.setItem(ITEMS_META_KEY, JSON.stringify(quotationMeta));
      setSaveState('saved');
      onTriggerToast('Draft saved successfully');
    } catch {
      setSaveState('idle');
      onTriggerToast('Could not save draft because browser storage is full.');
    }
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

    const payload = buildQuotePayload(
      watchedBusinessValues,
      watchedClientValues,
      itemsData,
      quotationMeta,
      taxRate,
      termsAndConditions,
    );
    const saved = saveQuotesSafely(QUOTES_STORAGE_KEY, payload);
    if (!saved) {
      setSaveState('idle');
      onTriggerToast('Could not save quote because browser storage is full. Try deleting older quotes first.');
      return;
    }

    onTriggerToast('Quote ready');
    navigate('/quotes');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title="Reset"
            >
              <RefreshCw size={18} />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
              {saveState === 'saving' ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-orange-500">Saving...</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600">Saved</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleBackOrHome}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              <span>{currentStep === 1 ? 'Home' : 'Back'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Save size={16} />
              Save Draft
            </button>

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#2F5BFF] px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-[#244ad9]"
            >
              <span>{currentStep === 4 ? 'Finalize' : 'Next Step'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
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
                  onScrollToSection={() => {}}
                  onOpenMobilePreview={() => {}}
                  showFooterNavigation={false}
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
                  showFooterNavigation={false}
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
                  showFooterNavigation={false}
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
                  onPrint={() => window.print()}
                  onDownloadPDF={() => window.print()}
                  onSendToClient={async () => onTriggerToast('Preview send action completed.')}
                  onPrev={() => setCurrentStep(3)}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
