import React, { useState, useEffect } from 'react';
import { UseFormRegister, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
  Building,
  Mail,
  Phone,
  Globe,
  Sparkles,
  ChevronDown,
  MapPin,
  Percent,
  Share2,
  Search,
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
  // Accordion states: closed by default
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  // Auto-expand accordion if any field inside has validation errors
  useEffect(() => {
    if (errors.address || errors.city || errors.state || errors.zipCode || errors.country) {
      setIsAddressOpen(true);
    }
  }, [errors.address, errors.city, errors.state, errors.zipCode, errors.country]);

  useEffect(() => {
    if (errors.taxType || errors.taxId) {
      setIsTaxOpen(true);
    }
  }, [errors.taxType, errors.taxId]);

  useEffect(() => {
    if (errors.socialLinks) {
      setIsSocialOpen(true);
    }
  }, [errors.socialLinks]);
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

  const [searchProfileQuery, setSearchProfileQuery] = useState('');

  return (
    <div className="space-y-5 md:space-y-6" id="business-form-wrapper">
      
      {/* Top Card: Use a saved business profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5" id="saved-profile-card">
        <label htmlFor="search-business-profile" className="block text-sm font-bold text-slate-800">
          Use a saved business profile
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="search-business-profile"
            placeholder="Search by business name"
            value={searchProfileQuery}
            onChange={(e) => setSearchProfileQuery(e.target.value)}
            className="w-full bg-white hover:bg-slate-50/50 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100/50 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* SECTION 1: Logo & Basic Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-5 shadow-xs" id="form-basic-section">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
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
              Your Business Name <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="biz-company-name"
                placeholder="Your Business Name"
                {...register('companyName', { 
                  required: 'Business name is required to build the quote.' 
                })}
                className={`w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-850 border rounded-xl pl-4 pr-10 py-2.5 min-h-[44px] text-sm font-semibold transition-all outline-hidden ${
                  errors.companyName 
                    ? 'border-red-500 focus:border-red-550 focus:ring-4 focus:ring-red-50' 
                    : 'border-slate-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100/50'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                <Sparkles className="w-4 h-4 text-[#2563EB] fill-[#2563EB]/20" />
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
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Describe what your business does (optional)
            </label>
            <textarea
              id="biz-tagline"
              placeholder="Describe what your business does (optional)"
              {...register('tagline')}
              className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-855 border border-slate-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100/50 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all outline-hidden h-20 max-h-36 placeholder:text-slate-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5" id="email-group">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email (optional)
            </label>
            <input
              type="text"
              id="biz-email"
              placeholder="email@yourbusiness.com"
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Must enter a valid email format, e.g., name@domain.com',
                },
              })}
              className={`w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-855 border rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-all outline-hidden ${
                errors.email 
                  ? 'border-red-500 focus:border-red-550 focus:ring-4 focus:ring-red-50' 
                  : 'border-slate-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100/50'
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
              Phone Number (optional)
            </label>
            <input
              type="text"
              id="biz-phone"
              placeholder="Phone Number (optional)"
              {...register('phone')}
              className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-855 border border-slate-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100/50 rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-all outline-hidden"
            />
          </div>

          {/* Website */}
          <div className="md:col-span-2 space-y-1.5" id="website-group">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Website (optional)
            </label>
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
                }
              })}
              className={`w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-855 border rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-all outline-hidden ${
                errors.website 
                  ? 'border-red-500 focus:border-red-550 focus:ring-4 focus:ring-red-50' 
                  : 'border-slate-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100/50'
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

      {/* SECTION 2: Business Address Info (Accordion) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300/80" id="address-section">
        <button
          type="button"
          id="toggle-business-address"
          onClick={() => setIsAddressOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-slate-50/50 cursor-pointer select-none"
          aria-expanded={isAddressOpen}
          aria-controls="business-address-content"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#1D4ED8] shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                Business Address <span className="text-slate-400 font-normal sm:font-medium text-xs sm:text-sm normal-case">(Optional)</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Add your complete business address</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-700 transition-transform duration-200 shrink-0 ${
              isAddressOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div
          id="business-address-content"
          className={isAddressOpen ? 'px-4 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-slate-100' : 'hidden'}
        >
          <BusinessAddress register={register} errors={errors} hideHeader={true} />
        </div>
      </div>

      {/* SECTION 3: Tax Information (Accordion) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300/80" id="tax-section">
        <button
          type="button"
          id="toggle-business-tax"
          onClick={() => setIsTaxOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-slate-50/50 cursor-pointer select-none"
          aria-expanded={isTaxOpen}
          aria-controls="business-tax-content"
        >
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                Tax Settings <span className="text-slate-400 font-normal sm:font-medium text-xs sm:text-sm normal-case">(Optional)</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Add your tax details if applicable</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-700 transition-transform duration-200 shrink-0 ${
              isTaxOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div
          id="business-tax-content"
          className={isTaxOpen ? 'px-4 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-slate-100' : 'hidden'}
        >
          <BusinessTaxInfo register={register} errors={errors} watch={watch} hideHeader={true} />
        </div>
      </div>

      {/* SECTION 4: Business Social Links (Accordion) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300/80" id="social-links-section">
        <button
          type="button"
          id="toggle-business-social"
          onClick={() => setIsSocialOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-slate-50/50 cursor-pointer select-none"
          aria-expanded={isSocialOpen}
          aria-controls="business-social-content"
        >
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-[#1D4ED8] shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                Business Social Links <span className="text-slate-400 font-normal sm:font-medium text-xs sm:text-sm normal-case">(Optional)</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Add links to your social media or other profiles</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-700 transition-transform duration-200 shrink-0 ${
              isSocialOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div
          id="business-social-content"
          className={isSocialOpen ? 'px-4 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-slate-100' : 'hidden'}
        >
          <BusinessSocialLinks control={control} register={register} errors={errors} watch={watch} hideHeader={true} />
        </div>
      </div>

    </div>
  );
}

