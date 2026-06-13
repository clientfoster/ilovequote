import React from 'react';
import { Building, ChevronRight, Image, MapPin, Share2, Sparkles, Smartphone } from 'lucide-react';
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
  onScrollToSection,
  onOpenMobilePreview,
  showFooterNavigation = true,
}: BusinessStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-2 xl:col-span-7 space-y-6">
        <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Step 1: Your Business Profile</h3>
            <p className="text-[10px] text-slate-450 font-medium">
              Verify your brand header details, logo, company address and tax identity flags.
            </p>
          </div>
        </div>

        <BusinessForm
          register={register}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {showFooterNavigation && (
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end">
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
            >
              <span>Next: Add Client</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-1 xl:col-span-5 lg:sticky lg:top-6 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
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
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-semibold text-slate-700 space-y-1.5">
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

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
            <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-wider">
              Quick Navigate Form Controls
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Business Details', section: 'form-basic-section', icon: <Building className="w-3.5 h-3.5" /> },
              { name: 'Logo Upload', section: 'logo-upload-group', icon: <Image className="w-3.5 h-3.5" /> },
              { name: 'Business Address', section: 'address-section', icon: <MapPin className="w-3.5 h-3.5" /> },
              { name: 'Social Links', section: 'social-links-section', icon: <Share2 className="w-3.5 h-3.5" /> },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => onScrollToSection(item.section)}
                className="p-2.5 text-left border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all font-bold text-[10px] text-slate-700 flex items-center gap-1.5 group cursor-pointer"
              >
                <span className="text-slate-400 group-hover:text-[#1D4ED8] transition-colors">{item.icon}</span>
                <span className="truncate">{item.name}</span>
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

