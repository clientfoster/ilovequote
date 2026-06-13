import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  PlusCircle, 
  LayoutDashboard, 
  Layers3, 
  FolderGit2, 
  HelpCircle, 
  ChevronRight, 
  RefreshCw, 
  TrendingUp, 
  FileText, 
  Settings as SettingsIcon,
  Sparkles,
  Award,
  Bolt,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Heart,
  QrCode,
  Building,
  Image,
  MapPin,
  Percent,
  Share2,
  Eye
} from 'lucide-react';
import { BusinessFormValues } from '../types';
import StepWizard from '../components/StepWizard';
import BusinessForm from '../components/BusinessForm';
import BusinessPreviewCard from '../components/BusinessPreviewCard';
import QRCodePreview from '../components/QRCodePreview';
import BrandMark from '../components/BrandMark';
import { DEFAULT_BUSINESS_VALUES } from '../wizard/WizardState';

const STORAGE_KEY = 'ilovequote_business_draft';

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'dashboard' | 'quotes' | 'templates' | 'portfolio' | 'qrcodes' | 'settings'>('business');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  // Initialize form with local storage draft or default values
  const getInitialValues = (): BusinessFormValues => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_BUSINESS_VALUES,
          ...parsed,
          socialLinks: parsed.socialLinks?.length ? parsed.socialLinks : DEFAULT_BUSINESS_VALUES.socialLinks,
        };
      }
    } catch (e) {
      console.error('Failed to load local storage business draft', e);
    }
    return DEFAULT_BUSINESS_VALUES;
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isValid },
    reset
  } = useForm<BusinessFormValues>({
    defaultValues: getInitialValues(),
    mode: 'onChange'
  });

  const watchedValues = watch();

  // Auto-save form values into Local Storage on change
  useEffect(() => {
    setIsSaving(true);
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedValues));
      } catch (e) {
        console.error('Failed to auto-save business draft state', e);
      }
      setIsSaving(false);
    }, 600); // Debounced saving indicator

    return () => clearTimeout(timeout);
  }, [watchedValues]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedValues));
      triggerToast('Draft saved successfully to Local Storage.');
    } catch (e) {
      triggerToast('Unable to secure local storage. Check permissions.');
    }
  };

  // Perform form validation and submission
  const onSubmit = (data: BusinessFormValues) => {
    triggerToast(`Congratulations! Step 1 Successful. Saved Business Profile as '${data.companyName}'.`);
  };

  const forceReset = () => {
    if (window.confirm('Are you sure you want to reset all profile data? This action cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      reset(DEFAULT_BUSINESS_VALUES);
      triggerToast('Profile parameters reverted to fresh setup values.');
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Temporary interactive highlight feedback and visual flash
      element.classList.add('ring-4', 'ring-blue-100', 'border-[#1D4ED8]', 'transition-all', 'duration-300');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-blue-100', 'border-[#1D4ED8]');
      }, 1500);
    } else {
      console.warn(`Element with ID ${id} not found.`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-800" id="app-viewport">
      
      {/* Toast Alert popups */}
      {showToast && (
        <div 
          className="fixed top-5 right-5 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl z-55 flex items-center gap-2 border border-slate-700 animate-slide-in"
          id="toast-notification"
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR: iLoveQuote branding & functional views selectors */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#E5E7EB] flex-col shrink-0" id="sidebar-navigation">
        
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandMark />
          </div>
        </div>

        {/* Action Button */}
        <div className="px-4 py-4">
          <button
            onClick={() => triggerToast('Initializing fresh quote container...')}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-100 transition-all cursor-pointer transform active:scale-95 hover:-translate-y-0.5"
            id="btn-sidebar-newquote"
          >
            <PlusCircle className="w-4 h-4" />
            New Quote
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'quotes', label: 'My Quotes', icon: <FileText className="w-4 h-4" /> },
            { id: 'templates', label: 'Templates', icon: <Layers3 className="w-4 h-4" /> },
            { id: 'business', label: 'My Portfolio', icon: <FolderGit2 className="w-4 h-4" />, highlight: true },
            { id: 'qrcodes', label: 'QR Codes', icon: <QrCode className="w-4 h-4" /> },
            { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (item.id !== 'business') {
                    triggerToast(`Switched view to simulated '${item.label}' panel.`);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50/70 text-[#1D4ED8]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#1D4ED8]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Help Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-700">Help & Support</p>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Need help setting up your invoice? Talk to our engineers.</p>
              <a 
                href="#help"
                onClick={() => triggerToast('Support portal offline. Contact us at help@ilovequote.com.')}
                className="text-[10px] text-[#2563EB] font-bold inline-block mt-1 hover:underline"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden" id="main-content-flow">
        
        {/* TOP HEADER */}
        <header className="bg-white border-b border-[#E5E7EB] py-4 px-6 md:px-8 flex items-center justify-between shrink-0" id="main-header">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 md:pr-4 md:border-r md:border-slate-150">
              <BrandMark size="sm" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                Create Quote
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                  Draft Mode
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block mt-1">Build, style, and send quotation bills in less than 2 minutes.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Reset option */}
            <button
              onClick={forceReset}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer text-xs font-bold"
              title="Reset Form Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Auto Save Status Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold mr-1">
              {isSaving ? (
                <span className="text-amber-600 flex items-center gap-0.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  Saving...
                </span>
              ) : (
                <span className="text-emerald-650 flex items-center gap-0.5">
                  <span className="font-bold">✓</span> Saved
                </span>
              )}
            </div>

            {/* Save Draft Action */}
            <button
              onClick={handleSaveDraft}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-[#E5E7EB] text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs"
              id="btn-header-savedraft"
            >
              Save Draft
            </button>

            {/* Next Step Action */}
            <button
              onClick={handleSubmit(onSubmit)}
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-blue-105"
              id="btn-header-nextstep"
            >
              Next: Client
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* User Profile Avatar */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#1D4ED8] to-indigo-650 flex items-center justify-center text-white text-xs font-extrabold shadow-inner border border-white">
              JD
            </div>
          </div>
        </header>

        {/* CONTAINER SCROLL */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] flex flex-col" id="content-scroll-box">
          <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
            
            {/* STEP WIZARD ROW */}
            <StepWizard currentStep={1} />

            {/* WORKSPACE LAYOUT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-8 items-start">
              
              {/* Column 1: Form Questionnaire Fields */}
              <div className="lg:col-span-2 xl:col-span-5 space-y-6" id="wizard-step-left">
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <BusinessForm 
                    register={register}
                    control={control}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                  />
                </form>
              </div>              {/* Column 2: Live Profile/Invoice Preview Card */}
              <div className="lg:col-span-1 xl:col-span-4 lg:sticky lg:top-6 space-y-4" id="wizard-step-middle">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-3.5 pl-1 flex-wrap gap-2">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                      Live Proposal Header Preview
                    </h3>
                    
                    {/* Mobile Only: Preview Portfolio Button */}
                    <button
                      type="button"
                      onClick={() => setIsMobilePreviewOpen(true)}
                      className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Preview Portfolio
                    </button>
                  </div>
                  <BusinessPreviewCard formData={watchedValues} />
                </div>

                {/* What You Can Add Section (Mobile Only) */}
                <div className="lg:hidden block space-y-4 mt-6" id="what-you-can-add-section">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-150">
                    <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      What You Can Add
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Business Basic Details */}
                    <button
                      type="button"
                      onClick={() => scrollToSection('form-basic-section')}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-start gap-3 w-full text-left transition-all hover:border-blue-300 hover:shadow-xs active:scale-[0.98] active:bg-slate-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-100 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
                        <Building className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-slate-800 transition-colors group-hover:text-[#1D4ED8]">Business Details</h4>
                        <p className="text-[11px] text-slate-450 mt-1 leading-normal font-medium">
                          Add your business name, tagline, contact email, phone and website.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1D4ED8] transition-colors shrink-0 self-center ml-auto" />
                    </button>

                    {/* Business Logo */}
                    <button
                      type="button"
                      onClick={() => scrollToSection('logo-upload-group')}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-start gap-3 w-full text-left transition-all hover:border-blue-300 hover:shadow-xs active:scale-[0.98] active:bg-slate-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-100 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
                        <Image className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-slate-800 transition-colors group-hover:text-[#1D4ED8]">Business Logo</h4>
                        <p className="text-[11px] text-slate-450 mt-1 leading-normal font-medium">
                          Upload your business logo to make your quotes look more professional.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1D4ED8] transition-colors shrink-0 self-center ml-auto" />
                    </button>

                    {/* Business Address */}
                    <button
                      type="button"
                      onClick={() => scrollToSection('address-section')}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-start gap-3 w-full text-left transition-all hover:border-blue-300 hover:shadow-xs active:scale-[0.98] active:bg-slate-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-100 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-slate-800 transition-colors group-hover:text-[#1D4ED8]">Business Address</h4>
                        <p className="text-[11px] text-slate-450 mt-1 leading-normal font-medium">
                          Add your complete business address that will appear on the quote.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1D4ED8] transition-colors shrink-0 self-center ml-auto" />
                    </button>

                    {/* Tax Information */}
                    <button
                      type="button"
                      onClick={() => scrollToSection('tax-section')}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-start gap-3 w-full text-left transition-all hover:border-blue-300 hover:shadow-xs active:scale-[0.98] active:bg-slate-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-100 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
                        <Percent className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-slate-800 transition-colors group-hover:text-[#1D4ED8]">Tax Information</h4>
                        <p className="text-[11px] text-slate-450 mt-1 leading-normal font-medium">
                          Add your GSTIN or other tax ID details if applicable.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1D4ED8] transition-colors shrink-0 self-center ml-auto" />
                    </button>

                    {/* Social Links */}
                    <button
                      type="button"
                      onClick={() => scrollToSection('social-links-section')}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-start gap-3 w-full text-left transition-all hover:border-blue-300 hover:shadow-xs active:scale-[0.98] active:bg-slate-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-100 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
                        <Share2 className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-slate-800 transition-colors group-hover:text-[#1D4ED8]">Social Links</h4>
                        <p className="text-[11px] text-slate-450 mt-1 leading-normal font-medium">
                          Add links to your social media profiles or website.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1D4ED8] transition-colors shrink-0 self-center ml-auto" />
                    </button>

                    {/* Live Preview */}
                    <button
                      type="button"
                      onClick={() => scrollToSection('wizard-step-middle')}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-start gap-3 w-full text-left transition-all hover:border-blue-300 hover:shadow-xs active:scale-[0.98] active:bg-slate-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-100 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
                        <Eye className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-slate-800 transition-colors group-hover:text-[#1D4ED8]">Live Preview</h4>
                        <p className="text-[11px] text-slate-450 mt-1 leading-normal font-medium">
                          See real-time preview of how business details look on the quote.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1D4ED8] transition-colors shrink-0 self-center ml-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 3: Smartphone QR Portfolio Preview */}
              <div className="hidden lg:block lg:col-span-1 xl:col-span-3 lg:sticky lg:top-6 space-y-4" id="wizard-step-right">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col items-center">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3.5 text-center">
                    QR Portfolio Live Simulation
                  </h3>
                  <QRCodePreview formData={watchedValues} />
                </div>
              </div>

            </div>

            {/* VALUE CLAIMS FEATURE BAR */}
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs" id="features-value-bar">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-stretch">
                
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-between text-center min-h-[145px] hover:border-blue-100 transition-all">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800">No Account Required</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Generate instantly. No passwords needed.</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-between text-center min-h-[145px] hover:border-blue-100 transition-all">
                  <div className="flex flex-col items-center space-y-2">
                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileCheck2 className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800">Auto Save</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Automatically backup locally instantly.</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-between text-center min-h-[145px] hover:border-blue-100 transition-all">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800">Easy Navigation</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Simple responsive steps wizard guide.</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-between text-center min-h-[145px] hover:border-blue-100 transition-all">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800">Mobile Friendly</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Preview dynamically configured displays.</p>
                </div>

                <div className="col-span-2 md:col-span-1 bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-between text-center min-h-[145px] hover:border-blue-100 transition-all">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Award className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800">100% Free</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Unlimited quotes and downloads forever.</p>
                </div>

              </div>
            </div>

            {/* FOOTER ACTIONS AREA */}
            <div className="flex items-center justify-between pt-4 pb-8" id="form-navigation-footer">
              <button
                type="button"
                onClick={() => triggerToast('You are on the first step: Business setup.')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-505 rounded-xl text-xs font-extrabold transition-colors cursor-not-allowed uppercase tracking-wider"
                disabled
              >
                Back To Home
              </button>
              
              <button
                type="button"
                id="btn-footer-next"
                onClick={handleSubmit(onSubmit)}
                className="inline-flex items-center gap-1 px-6 py-3 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-150 transform hover:-translate-y-0.5"
              >
                Next Step: Add Client
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </div>

      </main>

      {/* PORTFOLIO PREVIEW MODAL FOR MOBILE GRAPHIC */}
      {isMobilePreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="mobile-preview-modal shadow-2xl">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative flex flex-col items-center border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsMobilePreviewOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-sans text-sm font-bold shadow-xs cursor-pointer z-40"
              title="Close Preview"
            >
              ✕
            </button>
            <div className="w-full pt-4">
              <h3 className="text-sm font-extrabold text-slate-800 text-center uppercase tracking-widest mb-4">
                QR Portfolio Live Simulation
              </h3>
              <QRCodePreview formData={watchedValues} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
