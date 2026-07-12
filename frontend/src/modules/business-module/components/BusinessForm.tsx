import React, { useEffect, useState } from 'react';
import { UseFormRegister, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Building, Sparkles } from 'lucide-react';
import { BusinessFormValues } from '../../../types';
import BusinessLogoUpload from './BusinessLogoUpload';
import BusinessAddress from './BusinessAddress';
import BusinessTaxInfo from './BusinessTaxInfo';
import BusinessSocialLinks from './BusinessSocialLinks';

interface BusinessFormProps {
  register: UseFormRegister<BusinessFormValues>;
  control: Control<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  watch: UseFormWatch<BusinessFormValues>;
  setValue: UseFormSetValue<BusinessFormValues>;
}

export default function BusinessForm({ register, control, errors, watch, setValue }: BusinessFormProps) {
  const logoValue = watch('logo');
  const companyName = watch('companyName');
  const [showSummary, setShowSummary] = useState(true);

  useEffect(() => {
    if (companyName) {
      const generatedSlug = companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);

      setValue('businessSlug', generatedSlug);
    }
  }, [companyName, setValue]);

  const handleLogoChange = (base64: string) => {
    setValue('logo', base64);
  };

  return (
    <div className="space-y-4 md:space-y-5" id="business-form-wrapper">
      <div className="rounded-[16px] border border-slate-200 bg-white p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]" id="form-basic-section">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4">
          <label className="inline-flex items-start gap-3 self-start">
            <input
              type="checkbox"
              checked={showSummary}
              onChange={(event) => setShowSummary(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563EB] accent-[#2563EB] focus:ring-2 focus:ring-blue-200"
            />
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-slate-900">Business Information</h3>
              <p className="text-xs text-slate-500">Add your business details that will appear on the quote.</p>
            </div>
          </label>
        </div>

        {showSummary ? (
          <div className="grid grid-cols-1 gap-4 pt-4">
            <div className="space-y-1.5" id="company-name-group">
              <label className="text-[12px] font-medium text-slate-600" htmlFor="biz-company-name">Business Name</label>
              <div className="relative">
                <input
                  type="text"
                  id="biz-company-name"
                  placeholder="Your Business Name (required)"
                  {...register('companyName', {
                    required: 'Company name is required to build the quote.',
                  })}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 ${
                    errors.companyName
                      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50/30 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100'
                  }`}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                  <Sparkles className="h-4 w-4 fill-[#2563EB]/15 text-[#2563EB]" />
                </div>
              </div>
              {errors.companyName ? (
                <p className="mt-1 text-xs font-bold text-red-650" id="err-company-name">
                  {errors.companyName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5" id="tagline-group">
              <label className="text-[12px] font-medium text-slate-600" htmlFor="biz-tagline">Business Description</label>
              <textarea
                id="biz-tagline"
                placeholder="Describe what your business does (optional)"
                {...register('tagline')}
                className="h-24 max-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5" id="email-group">
              <label className="text-[12px] font-medium text-slate-600" htmlFor="biz-email">Email</label>
              <input
                type="text"
                id="biz-email"
                placeholder="Your Email (optional)"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Must enter a valid email format, e.g., name@domain.com',
                  },
                })}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50/30 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100'
                }`}
              />
              {errors.email ? (
                <p className="mt-1 text-xs font-bold text-red-650" id="err-email">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5" id="phone-group">
              <label className="text-[12px] font-medium text-slate-600" htmlFor="biz-phone">Phone Number</label>
              <input
                type="text"
                id="biz-phone"
                placeholder="Phone Number (optional)"
                {...register('phone')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5" id="website-group">
              <label className="text-[12px] font-medium text-slate-600" htmlFor="biz-website">Website</label>
              <input
                type="text"
                id="biz-website"
                placeholder="Website (optional)"
                {...register('website', {
                  validate: (v) => {
                    if (!v) return true;
                    if (!v.includes('.')) {
                      return 'Please enter a valid website domain or link';
                    }
                    return true;
                  },
                })}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 ${
                  errors.website
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50/30 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100'
                }`}
              />
              {errors.website ? (
                <p className="mt-1 text-xs font-bold text-red-650" id="err-website">
                  {errors.website.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5" id="logo-upload-inline">
              <BusinessLogoUpload value={logoValue} onChange={handleLogoChange} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-white p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <BusinessAddress register={register} errors={errors} />
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-white p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <BusinessTaxInfo register={register} errors={errors} watch={watch} />
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-white p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <BusinessSocialLinks control={control} register={register} errors={errors} watch={watch} />
      </div>
    </div>
  );
}
