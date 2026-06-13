import React from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { ClientFormValues } from '../../types';
import ClientForm from './components/ClientForm';
import LivePreview from './components/LivePreview';
import ShortcutCards from './components/ShortcutCards';
import FeatureSection from './components/FeatureSection';

interface ClientStepProps {
  register: UseFormRegister<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
  setValue: UseFormSetValue<ClientFormValues>;
  logoUrl: string | null;
  formData: ClientFormValues;
  onLogoChange: (base64: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onNext: () => void;
  onTriggerToast: (message: string) => void;
  showFooterNavigation?: boolean;
}

export default function ClientStep({
  register,
  errors,
  setValue,
  logoUrl,
  formData,
  onLogoChange,
  onSubmit,
  onBack,
  onNext,
  onTriggerToast,
  showFooterNavigation = true,
}: ClientStepProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl p-5 border border-blue-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Sparkles className="text-[#2563EB] shrink-0" size={16} />
            Client Information
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Add the recipient details that will appear in the quotation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 xl:col-span-5">
          <ClientForm
            register={register}
            errors={errors}
            setValue={setValue}
            logoUrl={logoUrl}
            onLogoChange={onLogoChange}
            onSubmit={onSubmit}
          />
        </div>

        <div className="lg:col-span-3 xl:col-span-4 lg:sticky lg:top-24">
          <LivePreview formData={formData} logoUrl={logoUrl} />
        </div>

        <div className="lg:col-span-3 lg:sticky lg:top-24">
          <ShortcutCards />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <FeatureSection />
      </div>

      {showFooterNavigation && (
        <div className="pt-6 border-t border-[#E5E7EB] flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F1F5F9] border border-[#E5E7EB] hover:bg-[#E2E8F0] text-[#475569] rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back to Business</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
          >
            <span>Next: Add Items</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:hidden">
        <button
          type="button"
          onClick={() => onTriggerToast('Client details are ready for the next step.')}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700"
        >
          <ChevronRight size={14} />
          Continue
        </button>
      </div>
    </div>
  );
}

