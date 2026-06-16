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
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-4 sm:px-5">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-800">
            <Sparkles className="shrink-0 text-[#2563EB]" size={16} />
            Client Information
          </h3>
          <p className="text-xs font-semibold leading-relaxed text-slate-500">
            Add the recipient details that will appear in the quote.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.76fr)_320px] xl:gap-8 items-start">
        <div>
          <ClientForm
            register={register}
            errors={errors}
            setValue={setValue}
            logoUrl={logoUrl}
            onLogoChange={onLogoChange}
            onSubmit={onSubmit}
          />
        </div>

        <div className="lg:sticky lg:top-24">
          <LivePreview formData={formData} logoUrl={logoUrl} />
        </div>

        <div className="lg:sticky lg:top-24">
          <ShortcutCards />
        </div>
      </div>

      {showFooterNavigation && (
        <div className="pt-2 hidden lg:flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D8E0EA] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Next: Add Items
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="pt-4 border-t border-slate-200">
        <FeatureSection />
      </div>
    </div>
  );
}
