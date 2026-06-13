import React from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Receipt, 
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { BusinessFormValues } from '../../../types';

interface BusinessPreviewCardProps {
  formData: Partial<BusinessFormValues>;
}

export default function BusinessPreviewCard({ formData }: BusinessPreviewCardProps) {
  const companyName = formData.companyName || 'Semixon Creative Agency';
  const tagline = formData.tagline || 'Elevating digital experiences with modern design.';
  const email = formData.email || 'hello@semixon.co';
  const phone = formData.phone || '+1 (555) 000-0000';
  const website = formData.website || 'https://semixon.co';
  const logo = formData.logo || '';
  const taxId = formData.taxId || '22AAAAA0000A1Z5';
  const taxType = formData.taxType || 'GSTIN';

  // Combine full mailing address elegantly
  const addressParts = [
    formData.address,
    formData.city,
    formData.state,
    formData.zipCode,
    formData.country
  ].filter(Boolean);
  
  const fullAddress = addressParts.length > 0 
    ? addressParts.join(', ') 
    : '204 Pine Street, Suite 100, San Francisco, CA, 94103, United States';

  return (
    <div 
      className="w-full bg-white border border-[#E5E7EB] rounded-[12px] shadow-lg overflow-hidden flex flex-col relative transition-all duration-300"
      id="live-invoice-profile-card"
    >
      {/* Decorative Brand Accent Line matching #1D4ED8 */}
      <div className="h-2 w-full bg-gradient-to-r from-[#1D4ED8] to-indigo-600 shrink-0" />

      {/* Internal Padding Body */}
      <div className="p-6 md:p-8 space-y-6">
        
        {/* TOP TEAM SECTION : Logo and Name */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          
          <div className="flex items-center gap-4">
            {/* Logo frame */}
            {logo ? (
              <div className="w-16 h-16 bg-white rounded-[12px] border border-slate-200/80 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img 
                  src={logo} 
                  alt="Business Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-[12px] flex items-center justify-center text-[#1D4ED8] shrink-0 font-extrabold text-2xl shadow-xs">
                {companyName.charAt(0).toUpperCase() || <Building2 className="w-8 h-8 opacity-80" />}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {companyName}
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-[#1D4ED8] uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">Business Profile Preview</p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-[#1D4ED8] uppercase block">
              /portfolio/{formData.businessSlug || 'semixon'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block flex items-center justify-start sm:justify-end gap-1">
              Live link auto-generation
              <ExternalLink className="w-3 h-3 text-[#1D4ED8]" />
            </span>
          </div>

        </div>

        {/* PROFILE SUMMARY SECTION */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">
            Description / Overview
          </p>
          <p className="text-sm text-slate-705 leading-relaxed font-medium">
            {tagline}
          </p>
        </div>

        {/* CORE INFORMATION SPLIT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Column A: Contact coordinates */}
          <div className="space-y-3.5">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              Contact Channels
            </h5>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800 break-all">{email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800">{phone}</span>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-bold text-[#1D4ED8] hover:underline cursor-pointer">{website}</span>
              </div>
            </div>

          </div>

          {/* Column B: Mailing coordinates */}
          <div className="space-y-3.5">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              Physical Location
            </h5>

            <div className="flex items-start gap-2 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed text-slate-800">{fullAddress}</span>
            </div>
          </div>

        </div>

        {/* BOTTOM ACCENT: Tax and regulatory specifications */}
        {taxId && (
          <div 
            className="mt-4 p-4 bg-slate-50 border border-slate-200/70 rounded-[12px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
            id="preview-tax-indicator"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GST Number</p>
                <p className="text-xs font-black text-slate-800 font-mono mt-0.5">{taxId}</p>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 self-start sm:self-center">
              <Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-500/20" />
              Tax Verified Quote
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

