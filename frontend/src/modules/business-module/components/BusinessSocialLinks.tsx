import React from 'react';
import { useFieldArray, Control, UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Share2, Plus, Trash2, HelpCircle, Linkedin, Instagram, Facebook, Twitter, Youtube, MessageCircle } from 'lucide-react';
import { BusinessFormValues } from '../../../types';

interface BusinessSocialLinksProps {
  control: Control<BusinessFormValues>;
  register: UseFormRegister<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  watch: UseFormWatch<BusinessFormValues>;
}

const PREDEFINED_PLATFORMS = [
  'LinkedIn',
  'Instagram',
  'Facebook',
  'X (Twitter)',
  'YouTube',
  'WhatsApp',
];

const PLATFORM_CONFIG: Record<string, { icon: React.ReactNode; accent: string; placeholder: string }> = {
  LinkedIn: {
    icon: <Linkedin className="w-4 h-4" />,
    accent: 'text-[#0A66C2] bg-[#E8F1FB]',
    placeholder: 'e.g. https://linkedin.com/company/semixon',
  },
  Instagram: {
    icon: <Instagram className="w-4 h-4" />,
    accent: 'text-[#E1306C] bg-[#FBEAF0]',
    placeholder: 'e.g. https://instagram.com/semixon',
  },
  Facebook: {
    icon: <Facebook className="w-4 h-4" />,
    accent: 'text-[#1877F2] bg-[#EAF2FD]',
    placeholder: 'e.g. https://facebook.com/semixon',
  },
  'X (Twitter)': {
    icon: <Twitter className="w-4 h-4" />,
    accent: 'text-slate-900 bg-slate-100',
    placeholder: 'e.g. https://x.com/semixon',
  },
  YouTube: {
    icon: <Youtube className="w-4 h-4" />,
    accent: 'text-[#FF0000] bg-[#FEECEC]',
    placeholder: 'e.g. https://youtube.com/@semixon',
  },
  WhatsApp: {
    icon: <MessageCircle className="w-4 h-4" />,
    accent: 'text-[#25D366] bg-[#EAFBF0]',
    placeholder: 'e.g. https://wa.me/919876543210',
  },
};

export default function BusinessSocialLinks({ control, register, errors: _errors, watch }: BusinessSocialLinksProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'socialLinks',
  });

  const handleAddSocial = () => {
    append({ platform: 'LinkedIn', url: '' });
  };

  return (
    <div className="space-y-4" id="social-links-section">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#1D4ED8]" />
          <div>
            <h3 className="text-base font-bold text-slate-800 font-sans">Business Social Links <span className="text-slate-400 font-medium">(Optional)</span></h3>
            <p className="text-xs text-slate-400 font-medium">Add links to your social media or other profiles</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="social-links-list">
        {fields.map((field, index) => {
          const platform = watch(`socialLinks.${index}.platform` as const) || field.platform || 'LinkedIn';
          const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.LinkedIn;
          return (
            <div 
              key={field.id} 
              className="min-w-0 rounded-xl border border-slate-100 bg-[#F8FAFC]/55 p-3 transition-all hover:bg-[#F8FAFC]/80"
              id={`social-link-row-${index}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${config.accent} flex items-center justify-center shrink-0`}>
                  {config.icon}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="relative">
                    <select
                      id={`social-platform-select-${index}`}
                      {...register(`socialLinks.${index}.platform` as const)}
                      className="w-full bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-lg px-3 py-3 min-h-[44px] text-xs font-bold transition-all outline-hidden appearance-none cursor-pointer pr-10"
                    >
                      {PREDEFINED_PLATFORMS.map((plat) => (
                        <option key={plat} value={plat}>
                          {plat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      id={`social-url-input-${index}`}
                      placeholder={config.placeholder}
                      {...register(`socialLinks.${index}.url` as const, {
                        validate: (val) => {
                          if (!val) return true;
                          if (!val.startsWith('http://') && !val.startsWith('https://') && !val.includes('.')) {
                            return 'Please enter a valid URL or web address';
                          }
                          return true;
                        }
                      })}
                      className="min-w-0 flex-1 bg-white hover:bg-slate-50/50 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 rounded-lg px-3 py-3 min-h-[44px] text-xs font-medium transition-all outline-hidden placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      id={`btn-remove-social-${index}`}
                      onClick={() => remove(index)}
                      className="inline-flex min-h-[44px] min-w-[44px] rounded-lg items-center justify-center bg-white border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-700 transition-colors shrink-0"
                      title="Remove this social link"
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.8]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {fields.length === 0 && (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/35 sm:col-span-2" id="social-empty">
            <HelpCircle className="w-8 h-8 text-slate-350 mx-auto stroke-[1.5] mb-1.5" />
            <p className="text-xs text-slate-500 font-medium">No social links configured yet.</p>
            <p className="text-[10px] text-slate-400 mt-1">Click "+ Add More" to add social profiles.</p>
          </div>
        )}

        <button
          type="button"
          id="btn-add-social-inline"
          onClick={handleAddSocial}
          className="sm:col-span-2 inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#1D4ED8] hover:bg-blue-50 font-extrabold text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add More
        </button>
      </div>
    </div>
  );
}

