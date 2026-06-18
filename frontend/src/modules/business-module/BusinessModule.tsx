import React from 'react';
import { Building, ChevronLeft, ChevronRight, Image, MapPin, Share2, Sparkles, Smartphone } from 'lucide-react';
import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { BusinessFormValues, ClientFormValues } from '../../types';
import BusinessForm from './components/BusinessForm';
import BusinessPreviewCard from './components/BusinessPreviewCard';
import QRCodePreview from './components/QRCodePreview';

interface BusinessStepProps {
  register: UseFormRegister<BusinessFormValues>;
  control: Control<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  watch: UseFormWatch<BusinessFormValues>;
  setValue: UseFormSetValue<BusinessFormValues>;
  businessValues: BusinessFormValues;
  clientValues: Partial<ClientFormValues>;
  onNext: () => void;
  onBack: () => void;
  onScrollToSection: (id: string) => void;
  onOpenMobilePreview: () => void;
  showFooterNavigation?: boolean;
}

export default function BusinessStep({
  register,
  control,
  errors,
  watch,
  setValue,
  businessValues,
  clientValues,
  onNext,
  onBack,
  onScrollToSection,
  onOpenMobilePreview,
  showFooterNavigation = true,
}: BusinessStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4 md:gap-8 items-start">
      <div className="lg:col-span-2 xl:col-span-7 space-y-4 md:space-y-6">
        <BusinessForm
          register={register}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {showFooterNavigation && (
          <div className="pt-6 border-t border-slate-250 hidden md:flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              className="inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
            >
              <span>Next: Add Client</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-1 xl:col-span-5 lg:sticky lg:top-6 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs flex flex-col" id="wizard-step-middle">
          <div className="flex items-center justify-between mb-3.5 pl-1 flex-wrap gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Live Preview Board
            </span>

            <button
              type="button"
              onClick={onOpenMobilePreview}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Preview Portfolio
            </button>
          </div>

          <div className="space-y-4">
            <BusinessPreviewCard formData={businessValues} />
            {(clientValues.companyName || clientValues.billingAddress || clientValues.email) && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-semibold text-slate-700 space-y-1.5 break-words">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Billing Target Client:</span>
                <p className="text-slate-900 font-extrabold">{clientValues.companyName}</p>
                {clientValues.billingAddress && (
                  <p className="text-[10px] font-medium leading-tight whitespace-pre-line text-slate-500">{clientValues.billingAddress}</p>
                )}
                {clientValues.email && (
                  <p className="text-[10px] text-slate-550 flex items-center gap-1">
                    <span>@</span> {clientValues.email}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden bg-white border border-slate-150 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
            <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-wider">
              What you can add
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { title: 'Business Basic Details', desc: 'Add your business name, tagline, contact email, phone and website.', section: 'form-basic-section', icon: <Building className="w-4 h-4" />, color: 'text-[#1D4ED8] bg-blue-50' },
              { title: 'Business Logo', desc: 'Upload your business logo to make your quotes look more professional.', section: 'logo-upload-inline', icon: <Image className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
              { title: 'Business Address', desc: 'Add your complete business address that will appear on the quote.', section: 'address-section', icon: <MapPin className="w-4 h-4" />, color: 'text-violet-600 bg-violet-50' },
              { title: 'Tax Information', desc: 'Add your GSTIN or other tax ID details if applicable.', section: 'tax-section', icon: <Share2 className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
              { title: 'Social Links', desc: 'Add links to your social media profiles or website.', section: 'social-links-section', icon: <Share2 className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
              { title: 'Live Preview', desc: 'See real-time preview of how your business details look in the quote.', section: 'wizard-step-middle', icon: <Sparkles className="w-4 h-4" />, color: 'text-sky-600 bg-sky-50' },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onScrollToSection(item.section)}
                className="min-h-[44px] w-full rounded-xl border border-slate-100 bg-white px-3 py-3 text-left transition-all hover:border-slate-200 hover:shadow-sm flex items-center gap-3 group cursor-pointer"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-slate-900 leading-tight">{item.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-4 font-medium text-slate-500">{item.desc}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-[#1D4ED8]" />
              </button>
            ))}
          </div>
        </div>

        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs items-center text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3.5">
            QR Live Smart Mockup
          </span>
          <QRCodePreview formData={businessValues} />
        </div>
      </div>
    </div>
  );
}

