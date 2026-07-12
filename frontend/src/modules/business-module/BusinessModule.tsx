import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import SearchableProfileSelect from '../../components/SearchableProfileSelect';
import { ProfileOption } from '../../profileAutofill';
import { BusinessFormValues, ClientFormValues } from '../../types';
import BusinessForm from './components/BusinessForm';
import BusinessPreviewCard from './components/BusinessPreviewCard';

interface BusinessStepProps {
  register: UseFormRegister<BusinessFormValues>;
  control: Control<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  watch: UseFormWatch<BusinessFormValues>;
  setValue: UseFormSetValue<BusinessFormValues>;
  businessValues: BusinessFormValues;
  clientValues: Partial<ClientFormValues>;
  isAuthed?: boolean;
  businessProfiles: Array<ProfileOption<Partial<BusinessFormValues>>>;
  selectedBusinessProfileId: string;
  onBusinessProfileChange: (value: string) => void;
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
  isAuthed = false,
  businessProfiles,
  selectedBusinessProfileId,
  onBusinessProfileChange,
  onNext,
  onBack,
  onOpenMobilePreview: _onOpenMobilePreview,
  showFooterNavigation = true,
}: BusinessStepProps) {
  return (
    <div className="grid grid-cols-1 gap-5 items-start lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-6">
      <div className="space-y-4 md:space-y-5 lg:pr-2">
        {isAuthed ? (
          <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <SearchableProfileSelect
              label="Use a saved business profile"
              value={selectedBusinessProfileId}
              onChange={onBusinessProfileChange}
              options={businessProfiles}
              placeholder="Search by business name"
              emptyMessage="No saved business profiles found."
            />
          </div>
        ) : null}

        <BusinessForm
          register={register}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {showFooterNavigation && (
          <div className="hidden items-center justify-between gap-4 border-t border-slate-200 pt-4 md:flex">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>Next: Add Client</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4 lg:sticky lg:top-[76px] lg:self-start lg:shrink-0 lg:overflow-visible lg:w-full" id="wizard-step-middle">
        <BusinessPreviewCard formData={businessValues} clientName={clientValues.companyName} />
      </div>
    </div>
  );
}
