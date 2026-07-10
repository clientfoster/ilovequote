import React from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Receipt,
} from 'lucide-react';
import { ClientFormValues } from '../../../types';

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
    country,
  } = formData;

  const hasFullAddress = billingAddress || city || state || zipCode || country;
  const addressLines = [
    billingAddress,
    [city, state].filter(Boolean).join(', '),
    [zipCode, country].filter(Boolean).join(', '),
  ].filter(Boolean) as string[];

  return (
    <div
      id="section-live-preview"
      className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <h4 className="text-sm font-bold text-slate-900">Preview</h4>
        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
          This is how client details will appear in your quote
        </p>
      </div>

      <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_52%)] p-5">
        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                <Building2 size={12} />
                Client Recipient
              </div>
              <h1 className="max-w-[280px] break-words text-xl font-bold leading-tight text-slate-900">
                {companyName || <span className="font-medium italic text-slate-300">Company Name</span>}
              </h1>
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <User size={13} className="shrink-0 text-slate-400" />
                <span>
                  {contactPerson || <span className="italic font-normal text-slate-300">Contact Person</span>}
                </span>
              </p>
            </div>

            <div className="shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Client branding logo"
                  className="h-16 w-auto max-w-[132px] rounded-2xl border border-slate-100 bg-white object-contain p-2 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-2 text-center text-slate-400">
                  <Building2 size={16} className="mb-1 opacity-50" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Logo Preview</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3.5 pt-5">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
              <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                <Mail size={11} /> Email
              </span>
              <p className="mt-1 text-sm font-medium text-slate-800 break-words">
                {email || <span className="font-normal italic text-slate-300">Email Address</span>}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
              <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                <Phone size={11} /> Contact Number
              </span>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {phone || <span className="font-normal italic text-slate-300">Phone Number</span>}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
              <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                <Globe size={11} /> Web URL
              </span>
              <p className="mt-1 text-sm font-medium text-[#2563EB] break-words">
                {website ? (
                  <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer">
                    {website}
                  </a>
                ) : (
                  <span className="font-normal italic text-slate-300">Website</span>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
              <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                <MapPin size={11} /> Bill-to Address
              </span>
              {hasFullAddress ? (
                <div className="mt-1 space-y-0.5 text-sm font-medium leading-relaxed text-slate-700">
                  {addressLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm font-normal italic text-slate-300">Billing Address</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Receipt size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {taxIdType === 'GSTIN' ? 'GST Number / GSTIN' : `${taxIdType} Number`}
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-slate-800 break-all text-right">
                {taxId || <span className="font-sans font-normal italic text-slate-300">Tax ID / GST Number</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
