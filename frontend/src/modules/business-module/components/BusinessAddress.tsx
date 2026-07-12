import React, { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { BusinessFormValues } from '../../../types';

interface BusinessAddressProps {
  register: UseFormRegister<BusinessFormValues>;
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

export default function BusinessAddress({ register }: BusinessAddressProps) {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="space-y-4" id="address-section">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3">
        <label className="inline-flex items-start gap-3 self-start">
          <input
            type="checkbox"
            checked={showSummary}
            onChange={(event) => setShowSummary(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563EB] accent-[#2563EB] focus:ring-2 focus:ring-blue-200"
          />
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">
              Business Address <span className="font-medium text-slate-400">(Optional)</span>
            </h3>
            <p className="text-xs text-slate-500">Add your complete business address.</p>
          </div>
        </label>
      </div>

      {showSummary ? (
        <div className="space-y-4">
          <div className="space-y-1.5" id="address-group">
            <label className="sr-only" htmlFor="address-street">Address</label>
            <input
              type="text"
              id="address-street"
              placeholder="Address (optional)"
              {...register('address')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            <div className="space-y-1.5" id="city-group">
              <label className="sr-only" htmlFor="address-city">City</label>
              <input
                type="text"
                id="address-city"
                placeholder="City (optional)"
                {...register('city')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5" id="state-group">
              <label className="sr-only" htmlFor="address-state">State</label>
              <input
                type="text"
                id="address-state"
                placeholder="State (optional)"
                {...register('state')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5" id="zip-group">
              <label className="sr-only" htmlFor="address-zip">PIN / ZIP Code</label>
              <input
                type="text"
                id="address-zip"
                placeholder="Postal Code / ZIP Code"
                {...register('zipCode')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5" id="country-group">
              <label className="sr-only" htmlFor="address-country">Country</label>
              <div className="relative">
                <select
                  id="address-country"
                  {...register('country')}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map((countryItem) => (
                    <option key={countryItem.code} value={countryItem.name}>
                      {countryItem.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
