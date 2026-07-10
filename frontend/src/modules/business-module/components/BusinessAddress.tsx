import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { BusinessFormValues } from '../../../types';

interface BusinessAddressProps {
  register: UseFormRegister<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
}

const COUNTRIES = [
  { name: 'India', code: 'IN' },
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Canada', code: 'CA' },
  { name: 'Australia', code: 'AU' },
  { name: 'Singapore', code: 'SG' },
  { name: 'Germany', code: 'DE' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'France', code: 'FR' },
  { name: 'Japan', code: 'JP' },
];

export default function BusinessAddress({ register, errors }: BusinessAddressProps) {
  return (
    <div className="space-y-4" id="address-section">
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
        <MapPin className="w-5 h-5 text-[#1D4ED8]" />
        <div>
          <h3 className="text-base font-bold text-slate-800">Business Address <span className="text-slate-400 font-medium">(Optional)</span></h3>
          <p className="text-xs text-slate-400 font-medium">Add your complete business address</p>
        </div>
      </div>

      {/* Street/Full Address */}
      <div className="space-y-1.5" id="address-group">
        <label className="sr-only" htmlFor="address-street">Address</label>
        <input
          type="text"
          id="address-street"
          placeholder="Address (optional)"
          {...register('address')}
          className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {/* City */}
        <div className="space-y-1.5" id="city-group">
          <label className="sr-only" htmlFor="address-city">City</label>
          <input
            type="text"
            id="address-city"
            placeholder="City (optional)"
            {...register('city')}
            className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3 min-h-[44px] text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
          />
        </div>

        {/* State */}
        <div className="space-y-1.5" id="state-group">
          <label className="sr-only" htmlFor="address-state">State</label>
          <input
            type="text"
            id="address-state"
            placeholder="State (optional)"
            {...register('state')}
            className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Zip/Pin Code */}
        <div className="space-y-1.5" id="zip-group">
          <label className="sr-only" htmlFor="address-zip">PIN / ZIP Code</label>
          <input
            type="text"
            id="address-zip"
            placeholder="Postal Code / ZIP Code"
            {...register('zipCode')}
            className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
          />
        </div>

        {/* Country */}
        <div className="space-y-1.5" id="country-group">
          <label className="sr-only" htmlFor="address-country">Country</label>
          <div className="relative">
            <select
              id="address-country"
              {...register('country')}
              className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3 min-h-[44px] text-sm font-medium transition-all outline-hidden appearance-none cursor-pointer"
            >
              <option value="">Select Country</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

