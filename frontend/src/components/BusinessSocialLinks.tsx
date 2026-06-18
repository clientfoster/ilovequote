import React from 'react';
import { useFieldArray, Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { Share2, Plus, Trash2, ArrowUpRight, HelpCircle } from 'lucide-react';
import { BusinessFormValues } from '../types';

interface BusinessSocialLinksProps {
  control: Control<BusinessFormValues>;
  register: UseFormRegister<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
}

const PREDEFINED_PLATFORMS = [
  'LinkedIn',
  'Instagram',
  'Facebook',
  'X (Twitter)',
  'YouTube',
  'WhatsApp'
];

export default function BusinessSocialLinks({ control, register, errors }: BusinessSocialLinksProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'socialLinks',
  });

  const handleAddSocial = () => {
    append({ platform: 'LinkedIn', url: '' });
  };

  return (
    <div className="space-y-4" id="social-links-section">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#1D4ED8]" />
          <h3 className="text-base font-bold text-slate-800 font-sans">Business Social Links</h3>
        </div>
        <button
          type="button"
          id="btn-add-social"
          onClick={handleAddSocial}
          className="inline-flex items-center gap-1 text-[#1D4ED8] hover:text-blue-800 font-extrabold text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Add More
        </button>
      </div>

      <div className="space-y-3" id="social-links-list">
        {fields.map((field, index) => {
          return (
            <div 
              key={field.id} 
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#F8FAFC]/55 border border-slate-100 p-3 rounded-xl transition-all hover:bg-[#F8FAFC]/80"
              id={`social-link-row-${index}`}
            >
              {/* Platform Select */}
              <div className="w-full sm:w-1/3 md:w-1/4" id={`social-platform-group-${index}`}>
                <div className="relative">
                  <select
                    id={`social-platform-select-${index}`}
                    {...register(`socialLinks.${index}.platform` as const)}
                    className="w-full bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all outline-hidden appearance-none cursor-pointer"
                  >
                    {PREDEFINED_PLATFORMS.map((plat) => (
                      <option key={plat} value={plat}>
                        {plat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* URL Input */}
              <div className="flex-1 relative" id={`social-url-group-${index}`}>
                <input
                  type="text"
                  id={`social-url-input-${index}`}
                  placeholder={`https://... or profile handle`}
                  {...register(`socialLinks.${index}.url` as const, {
                    validate: (val) => {
                      if (!val) return true;
                      if (!val.startsWith('http://') && !val.startsWith('https://') && !val.includes('.')) {
                        return 'Please enter a valid URL or web address';
                      }
                      return true;
                    }
                  })}
                  className="w-full bg-white hover:bg-slate-50/50 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-lg pl-3 pr-16 py-1.5 text-xs font-medium transition-all outline-hidden placeholder:text-slate-400"
                />
                
                {/* Visual verification badge or helper */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-[10px] text-slate-450">
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-350" />
                </div>
              </div>

              {/* Remove Action */}
              <div className="flex items-center justify-end" id={`social-delete-group-${index}`}>
                <button
                  type="button"
                  id={`btn-remove-social-${index}`}
                  onClick={() => remove(index)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-250 hover:bg-red-50 text-slate-400 hover:text-red-700 transition-colors"
                  title="Remove this social link"
                >
                  <Trash2 className="w-4 h-4 stroke-[1.8]" />
                </button>
              </div>
            </div>
          );
        })}

        {fields.length === 0 && (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/35" id="social-empty">
            <HelpCircle className="w-8 h-8 text-slate-350 mx-auto stroke-[1.5] mb-1.5" />
            <p className="text-xs text-slate-500 font-medium">No social links configured yet.</p>
            <p className="text-[10px] text-slate-400 mt-1">Click "+ Add Social Link" to start linking your online web catalogs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
