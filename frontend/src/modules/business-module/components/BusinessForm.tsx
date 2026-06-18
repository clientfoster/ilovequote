import React, { useEffect } from 'react';
import { UseFormRegister, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
  Building,
  Mail,
  Phone,
  Globe,
  Sparkles,
} from 'lucide-react';
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
  // Watch Logo and Company Name to automatically update custom parameters
  const logoValue = watch('logo');
  const companyName = watch('companyName');

  // Automatically generate portfolio slug from Company Name
  useEffect(() => {
    if (companyName) {
      const generatedSlug = companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .replace(/\s+/g, '-')          // replace spaces with hyphens
        .replace(/-+/g, '-')          // remove duplicate hyphens
        .substring(0, 30);            // cap length
      
      setValue('businessSlug', generatedSlug);
    }
  }, [companyName, setValue]);

  const handleLogoChange = (base64: string) => {
    setValue('logo', base64);
  };

  return (
    <div className="space-y-5 md:space-y-8" id="business-form-wrapper">
      
      {/* SECTION 1: Logo & Basic Information */}
      <div className="bg-white rounded-[14px] border border-slate-150 p-4 md:p-8 space-y-5 shadow-xs" id="form-basic-section">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
            <Building className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Business Information</h3>
            <p className="text-xs text-slate-400 font-medium">Add your business details that will appear on the quote</p>
          </div>
        </div>

        {/* Main Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Company Name */}
          <div className="md:col-span-2 space-y-1.5" id="company-name-group">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              Company Name <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="biz-company-name"
                placeholder="Semixon"
                {...register('companyName', { 
                  required: 'Company name is required to build the quote.' 
                })}
                className={`w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-850 border rounded-xl pl-4 pr-10 py-3 min-h-[44px] text-sm font-semibold transition-all outline-hidden ${
                  errors.companyName 
                    ? 'border-red-500 focus:border-red-550 focus:ring-4 focus:ring-red-50' 
                    : 'border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-105'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                <Sparkles className="w-4 h-4 text-[#1D4ED8] fill-[#1D4ED8]/20" />
              </div>
            </div>
            {errors.companyName && (
              <p className="text-xs text-red-650 font-bold mt-1" id="err-company-name">
                {errors.companyName.message}
              </p>
            )}
          </div>

          {/* Tagline / Business Description */}
          <div className="md:col-span-2 space-y-1.5" id="tagline-group">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Tagline / Business Description
              </label>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Optional</span>
            </div>
            <textarea
              id="biz-tagline"
              placeholder="We build digital solutions that help businesses grow."
              {...register('tagline')}
              className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-855 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-105 rounded-xl px-4 py-3 text-sm font-semibold transition-all outline-hidden h-24 max-h-40 placeholder:text-slate-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5" id="email-group">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email <span className="text-slate-400 font-medium normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              id="biz-email"
              placeholder="hello@semixon.com"
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Must enter a valid email format, e.g., name@domain.com',
                },
              })}
              className={`w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-855 border rounded-xl px-4 py-3 min-h-[44px] text-sm font-semibold transition-all outline-hidden ${
                errors.email 
                  ? 'border-red-500 focus:border-red-550 focus:ring-4 focus:ring-red-50' 
                  : 'border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-105'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-650 font-bold mt-1" id="err-email">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5" id="phone-group">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Phone <span className="text-slate-400 font-medium normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              id="biz-phone"
              placeholder="+91 98765 43210"
              {...register('phone')}
              className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-855 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-105 rounded-xl px-4 py-3 min-h-[44px] text-sm font-semibold transition-all outline-hidden"
            />
          </div>

          {/* Website */}
          <div className="md:col-span-2 space-y-1.5" id="website-group">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Website <span className="text-slate-400 font-medium normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              id="biz-website"
              placeholder="https://www.semixon.com"
              {...register('website', {
                validate: (v) => {
                  if (!v) return true;
                  // basic URL format validation with warning
                  if (!v.includes('.')) {
                    return 'Please enter a valid website domain or link';
                  }
                  return true;
                }
              })}
              className={`w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-855 border rounded-xl px-4 py-3 min-h-[44px] text-sm font-semibold transition-all outline-hidden ${
                errors.website 
                  ? 'border-red-500 focus:border-red-550 focus:ring-4 focus:ring-red-50' 
                  : 'border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-105'
              }`}
            />
            {errors.website && (
              <p className="text-xs text-red-650 font-bold mt-1" id="err-website">
                {errors.website.message}
              </p>
            )}
          </div>

          {/* Business Logo */}
          <div className="md:col-span-2 space-y-1.5" id="logo-upload-inline">
            <BusinessLogoUpload value={logoValue} onChange={handleLogoChange} />
          </div>
        </div>
      </div>

      {/* SECTION 2: Business Address Info */}
      <div className="bg-white rounded-xl border border-slate-150 p-4 md:p-8 shadow-xs">
        <BusinessAddress register={register} errors={errors} />
      </div>

      {/* SECTION 3: Tax Information */}
      <div className="bg-white rounded-xl border border-slate-150 p-4 md:p-8 shadow-xs">
        <BusinessTaxInfo register={register} errors={errors} watch={watch} />
      </div>

      {/* SECTION 4: Social Accounts with unlimited capabilities */}
      <div className="bg-white rounded-xl border border-slate-150 p-4 md:p-8 shadow-xs">
        <BusinessSocialLinks control={control} register={register} errors={errors} watch={watch} />
      </div>

    </div>
  );
}

