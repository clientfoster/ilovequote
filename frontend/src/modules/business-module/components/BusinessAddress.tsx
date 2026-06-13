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
        <h3 className="text-base font-bold text-slate-800">Business Address</h3>
      </div>

      {/* Street/Full Address */}
      <div className="space-y-1.5" id="address-group">
        <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">
          Address
        </label>
        <input
          type="text"
          id="address-street"
          placeholder="E.g., 204 Pine Street, Suite 100"
          {...register('address')}
          className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {/* City */}
        <div className="space-y-1.5" id="city-group">
          <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">
            City
          </label>
          <input
            type="text"
            id="address-city"
            placeholder="E.g., Mumbai or San Francisco"
            {...register('city')}
            className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3 min-h-[44px] text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
          />
        </div>

        {/* State */}
        <div className="space-y-1.5" id="state-group">
          <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">
            State / Region
          </label>
          <input
            type="text"
            id="address-state"
            placeholder="E.g., Maharashtra or California"
            {...register('state')}
            className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Zip/Pin Code */}
        <div className="space-y-1.5" id="zip-group">
          <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">
            PIN / ZIP Code
          </label>
          <input
            type="text"
            id="address-zip"
            placeholder="E.g., 400001 or 94103"
            {...register('zipCode')}
            className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
          />
        </div>

        {/* Country */}
        <div className="space-y-1.5" id="country-group">
          <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">
            Country
          </label>
          <div className="relative">
            <select
              id="address-country"
              {...register('country')}
              className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3 min-h-[44px] text-sm font-medium transition-all outline-hidden appearance-none cursor-pointer"
            >
              <option value="">Select country...</option>
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

