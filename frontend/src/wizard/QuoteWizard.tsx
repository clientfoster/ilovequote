import React, { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Moon, Save, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BusinessStep from '../modules/business-module/BusinessModule';
import ClientStep from '../modules/client-module/ClientModule';
import ItemsWorkspace from '../modules/items-module/ItemsModule';
import PreviewStep from '../modules/preview-module/PreviewModule';
import StepWizard from '../components/StepWizard';
import BrandMark from '../components/BrandMark';
import { createInitialItems } from '../itemData';
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
import { AUTH_STATE_EVENT, getScopedStorageKey, getScopedStorageKeyForScope, isAuthenticated } from '../auth';
import { NEW_DOCUMENT_EVENT } from '../documentReset';
import { loadQuoteAutofillProfiles, ProfileOption } from '../profileAutofill';
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

const makeQuoteId = () => `quote-${Date.now()}`;

const WIZARD_STEP_STORAGE_KEY = 'ilovequote_quote_wizard_step';
const GUEST_SCOPE = 'guest';

function formatSaveAge(savedAt: number | null, now: number) {
  if (!savedAt) return 'Waiting for changes';

  const elapsedSeconds = Math.max(0, Math.floor((now - savedAt) / 1000));
  if (elapsedSeconds < 2) return 'Just now';
  if (elapsedSeconds < 60) return `${elapsedSeconds} sec ago`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;

  return `${Math.floor(elapsedMinutes / 60)} hr ago`;
}

function readScopedStorageEntry(baseKey: string) {
  const currentKey = getScopedStorageKey(baseKey);
  const guestKey = getScopedStorageKeyForScope(baseKey, GUEST_SCOPE);

  const currentRaw = localStorage.getItem(currentKey);
  if (currentRaw !== null) {
    return { raw: currentRaw, sourceKey: currentKey };
  }

  const guestRaw = localStorage.getItem(guestKey);
  if (guestRaw !== null) {
    return { raw: guestRaw, sourceKey: guestKey };
  }

  const legacyRaw = localStorage.getItem(baseKey);
  if (legacyRaw !== null) {
    return { raw: legacyRaw, sourceKey: baseKey };
  }

  return { raw: null, sourceKey: currentKey };
}

function persistScopedStorageEntry(baseKey: string, raw: string) {
  localStorage.setItem(getScopedStorageKey(baseKey), raw);
}

const buildQuotePayload = (
  businessDetails: BusinessFormValues,
  clientDetails: ClientFormValues,
  clientLogo: string | null,
  items: ItemQuoteItem[],
  quotationMeta: ItemQuotationMeta,
  taxRate: number,
  terms: string,
  quoteId?: string | null,
  status: 'Draft' | 'Completed' = 'Draft',
) => {
  const totals = calculateQuotationTotals(items);
  const quoteNumber = quotationMeta.quotationNumber?.trim() || `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  return {
    id: quoteId || makeQuoteId(),
    quoteNumber,
    date: quotationMeta.date,
    expiryDate: quotationMeta.validUntil,
    status,
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
  const location = useLocation();
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

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(() => {
    try {
      const storedStep = window.sessionStorage.getItem(WIZARD_STEP_STORAGE_KEY);
      const parsed = Number(storedStep);
      return parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4 ? (parsed as 1 | 2 | 3 | 4) : 1;
    } catch {
      return 1;
    }
  });
  const [businessData, setBusinessData] = useState<BusinessFormValues>(DEFAULT_BUSINESS_VALUES);
  const [clientData, setClientData] = useState<ClientFormValues>(DEFAULT_CLIENT_VALUES);
  const [itemsData, setItemsData] = useState<ItemQuoteItem[]>(() => createInitialItems());
  const [quotationMeta, setQuotationMeta] = useState<ItemQuotationMeta>(DEFAULT_ITEM_META);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(18);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [termsList, setTermsList] = useState<TermItem[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saving');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveClock, setSaveClock] = useState(() => Date.now());
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFinalizingQuote, setIsFinalizingQuote] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(() => isAuthenticated());
  const [businessProfiles, setBusinessProfiles] = useState<Array<ProfileOption<Partial<BusinessFormValues>>>>([]);
  const [clientProfiles, setClientProfiles] = useState<Array<ProfileOption<Partial<ClientFormValues>>>>([]);
  const [selectedBusinessProfileId, setSelectedBusinessProfileId] = useState('manual');
  const [selectedClientProfileId, setSelectedClientProfileId] = useState('manual');
  const [authPromptIntent, setAuthPromptIntent] = useState<'draft' | 'final' | null>(null);
  const quoteContainerRef = useRef<HTMLDivElement | null>(null);
  const handledAfterLoginActionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastSavedAt) return undefined;

    const timer = window.setInterval(() => setSaveClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lastSavedAt]);

  const saveStatusLabel = saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Auto Saved' : 'Save unavailable';
  const saveStatusDetail = saveState === 'saving' ? 'Saving changes...' : formatSaveAge(lastSavedAt, saveClock);
  const saveStatusIcon = saveState === 'saving'
    ? <LoaderCircle className="mt-0.5 h-4 w-4 animate-spin text-[#2563EB]" />
    : <CheckCircle2 className={`mt-0.5 h-4 w-4 ${saveState === 'saved' ? 'text-emerald-500' : 'text-slate-400'}`} />;

  const {
    register: registerClient,
    handleSubmit: handleClientSubmit,
    control: clientControl,
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

  const watchedBusinessValues = useWatch({ control });
  const watchedClientValues = useWatch({ control: clientControl });

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

      const settingsEntry = readScopedStorageEntry(SETTINGS_STORAGE_KEY_BASE);
      const settingsRaw = settingsEntry.raw;
      const settings = settingsRaw ? JSON.parse(settingsRaw) : DEFAULT_SETTINGS;
      setTaxRate(settings.defaultGstPercent || 18);

      const initialTerms = '';
      setTermsAndConditions(initialTerms);

      const draftTermsEntry = readScopedStorageEntry('ilovequote_draft_terms_list');
      const draftTerms = draftTermsEntry.raw;
      if (draftTerms) {
        setTermsList(JSON.parse(draftTerms));
      } else {
        setTermsList(parseTermsStringToList(initialTerms));
      }

      const storedLogoEntry = readScopedStorageEntry(CLIENT_LOGO_KEY_BASE);
      if (storedLogoEntry.raw) setLogoUrl(storedLogoEntry.raw);

      const businessDraftEntry = readScopedStorageEntry(BUSINESS_DRAFT_KEY_BASE);
      if (businessDraftEntry.raw) {
        const parsed = JSON.parse(businessDraftEntry.raw);
        reset({ ...DEFAULT_BUSINESS_VALUES, ...parsed });
        setBusinessData({ ...DEFAULT_BUSINESS_VALUES, ...parsed });
        if (isAuthenticated() && businessDraftEntry.sourceKey !== BUSINESS_DRAFT_KEY) {
          persistScopedStorageEntry(BUSINESS_DRAFT_KEY_BASE, businessDraftEntry.raw);
        }
      }

      const clientDraftEntry = readScopedStorageEntry(CLIENT_DRAFT_KEY_BASE);
      if (clientDraftEntry.raw) {
        const parsed = JSON.parse(clientDraftEntry.raw);
        const normalizedClient = normalizeClientDraft(parsed);
        resetClient(normalizedClient);
        setClientData(normalizedClient);
        if (isAuthenticated() && clientDraftEntry.sourceKey !== CLIENT_DRAFT_KEY) {
          persistScopedStorageEntry(CLIENT_DRAFT_KEY_BASE, clientDraftEntry.raw);
        }
      }

      const itemsDraftEntry = readScopedStorageEntry(ITEMS_DRAFT_KEY_BASE);
      if (itemsDraftEntry.raw) {
        const parsed = JSON.parse(itemsDraftEntry.raw);
        if (Array.isArray(parsed) && parsed.length > 0) setItemsData(parsed);
        if (isAuthenticated() && itemsDraftEntry.sourceKey !== ITEMS_DRAFT_KEY) {
          persistScopedStorageEntry(ITEMS_DRAFT_KEY_BASE, itemsDraftEntry.raw);
        }
      }

      const metaDraftEntry = readScopedStorageEntry(ITEMS_META_KEY_BASE);
      if (metaDraftEntry.raw) {
        const parsed = JSON.parse(metaDraftEntry.raw);
        setQuotationMeta({ ...DEFAULT_ITEM_META, ...parsed });
        if (isAuthenticated() && metaDraftEntry.sourceKey !== ITEMS_META_KEY) {
          persistScopedStorageEntry(ITEMS_META_KEY_BASE, metaDraftEntry.raw);
        }
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

      const profiles = await loadQuoteAutofillProfiles({
        businessDraftStorageKey: BUSINESS_DRAFT_KEY,
        clientDraftStorageKey: CLIENT_DRAFT_KEY,
      });

      if (!cancelled) {
        setBusinessProfiles(profiles.businessProfiles);
        setClientProfiles(profiles.clientProfiles);
      }
    };

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, BUSINESS_DRAFT_KEY, CLIENT_DRAFT_KEY]);

  const handleBusinessProfileChange = (profileId: string) => {
    setSelectedBusinessProfileId(profileId);
    if (profileId === 'manual') return;

    const selectedProfile = businessProfiles.find((profile) => profile.id === profileId);
    if (!selectedProfile) return;

    Object.entries(selectedProfile.patch).forEach(([key, value]) => {
      setValue(key as keyof BusinessFormValues, value as never, { shouldDirty: true, shouldTouch: true });
    });
  };

  const handleClientProfileChange = (profileId: string) => {
    setSelectedClientProfileId(profileId);
    if (profileId === 'manual') return;

    const selectedProfile = clientProfiles.find((profile) => profile.id === profileId);
    if (!selectedProfile) return;

    Object.entries(selectedProfile.patch).forEach(([key, value]) => {
      setClientValue(key as keyof ClientFormValues, value as never, { shouldDirty: true, shouldTouch: true });
    });
  };

  useEffect(() => {
    const formattedTermsStr = termsList
      .map((t) => t.text)
      .filter((text) => text.trim() !== '')
      .map((text, idx) => `${idx + 1}. ${text}`)
      .join('\n');
    setTermsAndConditions(formattedTermsStr);
  }, [termsList]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(WIZARD_STEP_STORAGE_KEY, String(currentStep));
    } catch {
      // Keep the wizard usable even if session storage is unavailable.
    }
  }, [currentStep]);

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
        setLastSavedAt(Date.now());
        setSaveStatus('saved');
      } catch {
        setSaveState('idle');
        setLastSavedAt(null);
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

  const persistDraftSnapshot = () => {
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
      window.sessionStorage.setItem(WIZARD_STEP_STORAGE_KEY, String(currentStep));
    } catch {
      // Keep navigation usable even when storage is near capacity.
    }
  };

  const buildAfterLoginReturnTo = (action: 'saveDraft' | 'finalizeQuote') => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('afterLogin', action);
    const search = searchParams.toString();
    return `${location.pathname}${search ? `?${search}` : ''}`;
  };

  const goToLogin = (mode: 'signup' | 'login') => {
    const action = authPromptIntent === 'draft' ? 'saveDraft' : 'finalizeQuote';
    persistDraftSnapshot();
    navigate(`/login?mode=${mode}&returnTo=${encodeURIComponent(buildAfterLoginReturnTo(action))}`);
  };

  const handleReset = () => {
    setBusinessData(DEFAULT_BUSINESS_VALUES);
    setClientData(DEFAULT_CLIENT_VALUES);
    setItemsData(createInitialItems());
    setQuotationMeta(DEFAULT_ITEM_META);
    setLogoUrl(null);
    setTaxRate(DEFAULT_SETTINGS.defaultGstPercent);
    setTermsAndConditions('');
    setTermsList([]);
    reset(DEFAULT_BUSINESS_VALUES);
    resetClient(DEFAULT_CLIENT_VALUES);
    localStorage.removeItem(BUSINESS_DRAFT_KEY);
    localStorage.removeItem(CLIENT_DRAFT_KEY);
    localStorage.removeItem(CLIENT_LOGO_KEY);
    localStorage.removeItem(ITEMS_DRAFT_KEY);
    localStorage.removeItem(ITEMS_META_KEY);
    localStorage.removeItem(TERMS_STORAGE_KEY);
    localStorage.removeItem(EDITING_QUOTE_ID_KEY);
    window.sessionStorage.removeItem(WIZARD_STEP_STORAGE_KEY);
    setSelectedBusinessProfileId('manual');
    setSelectedClientProfileId('manual');
    setEditingQuoteId(null);
    setSaveState('idle');
    setLastSavedAt(null);
    onTriggerToast('Draft reset');
  };

  useEffect(() => {
    const handleNewDocument = (event: Event) => {
      const detail = (event as CustomEvent<{ module?: string }>).detail;
      if (detail?.module !== 'quote') return;
      handleReset();
    };

    window.addEventListener(NEW_DOCUMENT_EVENT, handleNewDocument);
    return () => window.removeEventListener(NEW_DOCUMENT_EVENT, handleNewDocument);
  }, []);

  const handleStepBack = () => setCurrentStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));

  const handleBackOrHome = () => {
    if (currentStep === 1) {
      navigate('/dashboard');
      return;
    }

    handleStepBack();
  };

  const buildCurrentPayload = (status: 'Draft' | 'Completed' = 'Draft') =>
    buildQuotePayload(
      watchedBusinessValues,
      watchedClientValues,
      logoUrl,
      itemsData,
      quotationMeta,
      taxRate,
      termsAndConditions,
      editingQuoteId,
      status,
    );

  const saveQuoteToApi = async (payload: ReturnType<typeof buildQuotePayload>) => {
    if (editingQuoteId) {
      try {
        const response = await updateQuote(editingQuoteId, {
          ...payload,
          id: editingQuoteId,
        });
        return response.quote;
      } catch (error) {
        if (!(error instanceof Error) || !/quote not found/i.test(error.message)) {
          throw error;
        }

        localStorage.removeItem(EDITING_QUOTE_ID_KEY);
        setEditingQuoteId(null);
        const response = await createQuote({
          ...payload,
          id: makeQuoteId(),
        });
        return response.quote;
      }
    }

    const response = await createQuote(payload);
    return response.quote;
  };

  const handleSaveDraft = () => {
    if (isSavingDraft) return;
    if (!isAuthenticated()) {
      persistDraftSnapshot();
      setAuthPromptIntent('draft');
      return;
    }

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
        setLastSavedAt(Date.now());
        setSaveStatus('saved');
        onTriggerToast('Draft saved successfully');
      })
      .catch(() => {
        persistDraftLocally();
        setSaveState('idle');
        setLastSavedAt(null);
        setSaveStatus('idle');
        onTriggerToast('Draft saved locally');
      })
      .finally(() => {
        setIsSavingDraft(false);
      });
  };

  const handleStepNext = () => setCurrentStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));

  const handlePrimaryAction = async () => {
    if (isFinalizingQuote) return;

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

    if (!isAuthenticated()) {
      persistDraftSnapshot();
      setAuthPromptIntent('final');
      return;
    }

    try {
      setIsFinalizingQuote(true);
      setSaveState('saving');
      setSaveStatus('saving');
      const payload = buildCurrentPayload('Completed');
      await saveQuoteToApi(payload);
      setEditingQuoteId(null);
      localStorage.removeItem(EDITING_QUOTE_ID_KEY);
      localStorage.removeItem(BUSINESS_DRAFT_KEY);
      localStorage.removeItem(CLIENT_DRAFT_KEY);
      localStorage.removeItem(CLIENT_LOGO_KEY);
      localStorage.removeItem(ITEMS_DRAFT_KEY);
      localStorage.removeItem(ITEMS_META_KEY);
      localStorage.removeItem(TERMS_STORAGE_KEY);
      window.sessionStorage.removeItem(WIZARD_STEP_STORAGE_KEY);
      setSaveState('saved');
      setLastSavedAt(Date.now());
      setSaveStatus('saved');
      onTriggerToast('Quote saved successfully');
      navigate('/quotes');
    } catch (error) {
      setSaveState('idle');
      setLastSavedAt(null);
      onTriggerToast(error instanceof Error ? error.message : 'Could not save quote.');
    } finally {
      setIsFinalizingQuote(false);
    }
  };

  useEffect(() => {
    const afterLoginAction = new URLSearchParams(location.search).get('afterLogin');
    if (!afterLoginAction || !isAuthenticated() || handledAfterLoginActionRef.current === afterLoginAction) return;

    handledAfterLoginActionRef.current = afterLoginAction;
    navigate(location.pathname, { replace: true });

    if (afterLoginAction === 'saveDraft') {
      handleSaveDraft();
      return;
    }

    if (afterLoginAction === 'finalizeQuote' && currentStep === 4) {
      void handlePrimaryAction();
    }
  }, [currentStep, handlePrimaryAction, handleSaveDraft, location.pathname, location.search, navigate]);

  return (
    <div className="quote-wizard-shell [overflow-x:clip] bg-slate-50 text-slate-900">
      <AnimatePresence>
        {authPromptIntent ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthPromptIntent(null)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
              aria-label="Close save prompt"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:p-7"
            >
              <button
                type="button"
                onClick={() => setAuthPromptIntent(null)}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2457F0]">
                <ShieldCheck size={26} />
              </div>

              <h2 className="mt-5 text-[24px] font-black tracking-tight text-slate-950">
                Create account or sign in to save this quote
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                {authPromptIntent === 'draft'
                  ? 'Sign in to save this quote to your records history and access it later from your dashboard.'
                  : 'Sign in to save this quote, store it in your records history, and continue sharing it with your client.'}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => goToLogin('signup')}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-[#2457F0] px-5 text-[15px] font-bold text-white shadow-[0_14px_28px_rgba(36,87,240,0.24)] transition hover:bg-[#1d4ed8]"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => goToLogin('login')}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-[15px] font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  Sign In
                </button>
              </div>

              <p className="mt-4 text-center text-[12px] font-medium text-slate-400">
                Your quote will only be added to history after you log in.
              </p>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur md:relative md:z-30">
        <div className="mx-auto hidden max-w-[1680px] items-center justify-between gap-4 px-4 py-2 md:flex md:px-4 md:py-3">
          <div className="flex min-w-0 items-center gap-4">
            <BrandMark />
            <div className="h-8 w-px bg-slate-200" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-extrabold leading-none text-slate-900">Create Quote</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  DRAFT
                </span>
                <span className="text-[11px] font-semibold text-slate-500">{quotationMeta.quotationNumber || 'Q-2026-00021'}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">Build, style, and send quotation bills in less than 2 minutes.</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              className="inline-flex h-10 min-h-[40px] w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Theme toggle"
            >
              <Moon size={18} />
            </button>

            <div className="flex items-start gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 shadow-sm">
              {saveStatusIcon}
              <div className="leading-tight">
                <p className="text-[12px] font-semibold text-slate-800">{saveStatusLabel}</p>
                <p className="text-[10px] text-slate-400">{saveStatusDetail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isFinalizingQuote}
              className="inline-flex h-10 min-h-[40px] items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isFinalizingQuote && currentStep === 4 ? <LoaderCircle size={16} className="animate-spin" /> : null}
              <span>{currentStep === 4 ? (isFinalizingQuote ? 'Saving Quote...' : 'Save Quote') : currentStep === 3 ? 'Next: Preview' : currentStep === 2 ? 'Next: Add Items' : 'Next: Add Client'}</span>
              {!isFinalizingQuote || currentStep !== 4 ? <ChevronRight size={16} /> : null}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 shadow-sm">
            {saveStatusIcon}
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-slate-800">{saveStatusLabel}</p>
              <p className="text-[10px] text-slate-400">{saveStatusDetail}</p>
            </div>
          </div>
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

      <div className="mx-auto max-w-[1680px] px-4 pt-2 pb-20 md:px-4 md:pt-2.5 md:pb-8">
        <div className="no-print md:sticky md:top-3 z-20">
          <StepWizard currentStep={currentStep} onStepClick={(step) => setCurrentStep(step as 1 | 2 | 3 | 4)} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mt-4">
              {currentStep === 1 && (
                <BusinessStep
                  register={register}
                  control={control}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  businessValues={watchedBusinessValues}
                  clientValues={watchedClientValues}
                  isAuthed={isAuthed}
                  businessProfiles={businessProfiles}
                  selectedBusinessProfileId={selectedBusinessProfileId}
                  onBusinessProfileChange={handleBusinessProfileChange}
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
                  isAuthed={isAuthed}
                  clientProfiles={clientProfiles}
                  selectedClientProfileId={selectedClientProfileId}
                  onClientProfileChange={handleClientProfileChange}
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
                  onSendToClient={async () => onTriggerToast('Preview send action completed.')}
                  onPrev={() => setCurrentStep(3)}
                  quoteContainerRef={quoteContainerRef}
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
            disabled={isFinalizingQuote}
            className="inline-flex min-h-[44px] flex-[1.35] items-center justify-center gap-2 rounded-2xl bg-[#2F5BFF] px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isFinalizingQuote && currentStep === 4 ? <LoaderCircle size={16} className="animate-spin" /> : null}
            <span>{currentStep === 4 ? (isFinalizingQuote ? 'Saving...' : 'Save') : 'Next'}</span>
            {!isFinalizingQuote || currentStep !== 4 ? <ChevronRight size={16} /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}
