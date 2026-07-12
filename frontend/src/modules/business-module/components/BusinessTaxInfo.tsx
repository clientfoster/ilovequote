import React, { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { BusinessFormValues } from '../../../types';

interface BusinessTaxInfoProps {
  register: UseFormRegister<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  watch: UseFormWatch<BusinessFormValues>;
}

export default function BusinessTaxInfo({ register, watch }: BusinessTaxInfoProps) {
  const [showSummary, setShowSummary] = useState(false);

  const selectedTaxType = watch('taxType') || 'GSTIN';
  const taxId = watch('taxId');

  return (
    <div className="space-y-4" id="tax-section">
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
              Tax Settings <span className="font-medium text-slate-400">(Optional)</span>
            </h3>
            <p className="text-xs text-slate-500">Add your tax details if applicable.</p>
          </div>
        </label>
      </div>

      {showSummary ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <div className="space-y-1.5" id="tax-type-group">
            <label className="sr-only" htmlFor="tax-id-type">Tax ID Type</label>
            <div className="relative">
              <select
                id="tax-id-type"
                {...register('taxType')}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="GSTIN">GSTIN</option>
                <option value="VAT">VAT</option>
                <option value="PAN">PAN</option>
                <option value="Other">Other Type</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5" id="tax-id-group">
            <label className="sr-only" htmlFor="tax-id-number">Tax ID / GST Number</label>
            <input
              type="text"
              id="tax-id-number"
              placeholder={
                selectedTaxType === 'GSTIN'
                  ? 'Your GSTIN (optional)'
                  : selectedTaxType === 'PAN'
                    ? 'Your PAN (optional)'
                    : 'Tax ID / Registration Number (optional)'
              }
              {...register('taxId')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
