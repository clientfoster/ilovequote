import React from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Receipt,
  FileCheck2
} from 'lucide-react';
import { ClientFormValues } from '../types';

interface LivePreviewProps {
  formData: Partial<ClientFormValues>;
  logoUrl: string | null;
}

export default function LivePreview({ formData, logoUrl }: LivePreviewProps) {
  const {
    companyName,
    contactPerson,
    email,
    phone,
    website,
    taxIdType = 'GSTIN',
    taxId,
    billingAddress,
    city,
    state,
    zipCode,
    country
  } = formData;

  const hasFullAddress = billingAddress || city || state || zipCode || country;

  return (
    <div
      id="section-live-preview"
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden sticky top-24 transition-all duration-300 hover:shadow-lg hover:border-slate-300/80 scroll-mt-24"
    >
      <div className="bg-gradient-to-r from-blue-600 via-[#2563EB] to-indigo-600 px-6 py-4 flex justify-between items-center text-white">
        <div>
          <h4 className="text-sm font-bold">Preview</h4>
          <p className="text-[10px] text-blue-100 font-medium mt-0.5">
            This is how client details will appear in your quote.
          </p>
        </div>
        <FileCheck2 size={20} className="text-blue-100 opacity-90" />
      </div>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1 max-w-[65%]">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Client Recipient</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight break-words">
              {companyName ? companyName : <span className="text-slate-300 italic font-medium">Company Name</span>}
            </h1>
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
              <User size={13} className="text-slate-400 shrink-0" />
              <span>
                {contactPerson ? contactPerson : <span className="text-slate-300 italic font-normal">Contact Person</span>}
              </span>
            </p>
          </div>

          <div className="shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Client branding logo"
                className="h-14 w-auto max-w-[124px] object-contain rounded-lg p-1.5 bg-white border border-slate-100 shadow-2xs"
              />
            ) : (
              <div className="h-14 w-28 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-2 text-center text-slate-400">
                <Building2 size={16} className="mb-0.5 opacity-60" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Client Logo</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
              <Mail size={11} /> email
            </span>
            <p className="text-xs font-medium text-slate-800 truncate">
              {email ? email : <span className="text-slate-300 italic font-normal">Email Address</span>}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
              <Phone size={11} /> contact number
            </span>
            <p className="text-xs font-medium text-slate-800 truncate">
              {phone ? phone : <span className="text-slate-300 italic font-normal">Phone Number</span>}
            </p>
          </div>

          <div className="space-y-0.5 sm:col-span-2">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
              <Globe size={11} /> web url
            </span>
            <p className="text-xs font-medium text-[#2563EB] hover:underline truncate">
              {website ? (
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer">
                  {website}
                </a>
              ) : (
                <span className="text-slate-300 italic font-normal">Website</span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2 pb-4 border-b border-slate-100">
          <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
            <MapPin size={11} /> bill-to address
          </span>
          {hasFullAddress ? (
            <div className="text-xs font-medium text-slate-700 leading-relaxed space-y-0.5">
              {billingAddress && <p className="whitespace-pre-line">{billingAddress}</p>}
              {(city || state) && <p>{[city, state].filter(Boolean).join(', ')}</p>}
              {(zipCode || country) && <p>{[zipCode, country].filter(Boolean).join(', ')}</p>}
            </div>
          ) : (
            <p className="text-xs text-slate-300 italic font-normal">Billing Address</p>
          )}
        </div>

        <div className="flex items-center justify-between bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {taxIdType === 'GSTIN' ? 'GST Number / GSTIN' : `${taxIdType} Number`}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-800">
            {taxId ? taxId : <span className="text-slate-300 italic font-normal font-sans">Tax ID / GST Number</span>}
          </span>
        </div>
      </div>

      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>iLoveQuote Engine Preview</span>
        <span className="flex items-center gap-1 text-[#2563EB] font-bold">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
          Realtime Active
        </span>
      </div>
    </div>
  );
}
