import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { BusinessFormValues, ClientFormValues } from '../../types';
import BusinessForm from './components/BusinessForm';
import LivePreviewBoard from './components/LivePreviewBoard';

interface BusinessStepProps {
  register: UseFormRegister<BusinessFormValues>;
  control: Control<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  watch: UseFormWatch<BusinessFormValues>;
  setValue: UseFormSetValue<BusinessFormValues>;
  businessValues: BusinessFormValues;
  clientValues: Partial<ClientFormValues>;
  quoteNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  onNext: () => void;
  onBack: () => void;
  onScrollToSection?: (id: string) => void;
  onOpenMobilePreview?: () => void;
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
  quoteNumber,
  issueDate,
  expiryDate,
  onNext,
  onBack,
  showFooterNavigation = true,
}: BusinessStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Form */}
      <div className="lg:col-span-7 space-y-6">
        <BusinessForm
          register={register}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {showFooterNavigation && (
          <div className="pt-4 border-t border-slate-200 hidden md:flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              className="inline-flex min-h-[42px] items-center gap-2 px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              <span>Next: Add Client</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Dual Card Live Preview Board */}
      <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
        <LivePreviewBoard
          formData={businessValues}
          clientData={clientValues}
          quoteNumber={quoteNumber}
          issueDate={issueDate}
          expiryDate={expiryDate}
        />
      </div>
    </div>
  );
}

