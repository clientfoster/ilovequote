import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Percent } from 'lucide-react';
import { BusinessFormValues, TaxType } from '../../../types';

interface BusinessTaxInfoProps {
  register: UseFormRegister<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  watch: UseFormWatch<BusinessFormValues>;
}

export default function BusinessTaxInfo({ register, errors, watch }: BusinessTaxInfoProps) {
  const selectedTaxType = watch('taxType') || 'GSTIN';

  const getTaxPlaceholder = (type: TaxType) => {
    switch (type) {
      case 'GSTIN':
        return 'E.g., 22AAAAA0000A1Z5';
      case 'VAT':
        return 'E.g., GB123456789';
      case 'PAN':
        return 'E.g., ABCDE1234F';
      default:
        return 'E.g., Tax reference or registration number';
    }
  };

  return (
    <div className="space-y-4" id="tax-section">
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
        <Percent className="w-5 h-5 text-[#1D4ED8]" />
        <div>
          <h3 className="text-base font-bold text-slate-800">Tax Information <span className="text-slate-400 font-medium">(Optional)</span></h3>
          <p className="text-xs text-slate-400 font-medium">Add your tax details if applicable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {/* Tax ID Type Select */}
        <div className="space-y-1.5" id="tax-type-group">
          <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">
            Tax ID Type
          </label>
          <div className="relative">
            <select
              id="tax-id-type"
              {...register('taxType')}
              className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3 min-h-[44px] text-sm font-medium transition-all outline-hidden appearance-none cursor-pointer"
            >
              <option value="GSTIN">GSTIN</option>
              <option value="VAT">VAT</option>
              <option value="PAN">PAN</option>
              <option value="Other">Other Type</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tax ID Input */}
        <div className="space-y-1.5" id="tax-id-group">
          <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">
            Tax ID / GST Number
          </label>
          <input
            type="text"
            id="tax-id-number"
            placeholder={getTaxPlaceholder(selectedTaxType)}
            {...register('taxId')}
            className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3 min-h-[44px] text-sm font-medium transition-all outline-hidden placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}

