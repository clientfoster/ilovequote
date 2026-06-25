import React from 'react';
import { Globe, Mail, MapPin, Phone, Receipt } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BusinessFormValues } from '../../../types';
import { buildAppUrl } from '../../../url';

interface BusinessPreviewCardProps {
  formData: Partial<BusinessFormValues>;
}

export default function BusinessPreviewCard({ formData }: BusinessPreviewCardProps) {
  const companyName = formData.companyName || 'Your Business';
  const tagline = formData.tagline || '';
  const email = formData.email || '';
  const phone = formData.phone || '';
  const website = formData.website || '';
  const address = formData.address || '';
  const taxId = formData.taxId || '';
  const portfolioSlug = formData.businessSlug || 'your-business';
  const qrUrl = buildAppUrl(`/portfolio/${portfolioSlug}`);
  const logo = formData.logo || '';
  const addressParts = [formData.address, formData.city, formData.state, formData.zipCode, formData.country].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : address;

  return (
    <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
      <div className="bg-[#0A0C14] px-4 pb-4 pt-4 text-white">
        <div className="grid grid-cols-[minmax(0,1fr)_88px] items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white">
                {logo ? (
                  <img src={logo} alt={`${companyName} logo`} className="h-full w-full object-contain p-1.5" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white">
                    <span className="text-[17px] font-black leading-none text-[#2457F0]">{companyName.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="break-words text-[19px] font-black leading-tight tracking-normal">
                  {companyName}
                </p>
                {tagline && <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-white/78">{tagline}</p>}
              </div>
            </div>

            <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white/8">
              <div className="h-full w-[128px] rounded-full bg-[#2457F0]" />
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-start">
            <p className="mb-1 text-center text-[8px] font-bold uppercase leading-3 tracking-[0.12em] text-white/75">
              Portfolio
            </p>
            <div className="rounded-[18px] bg-white/8 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[14px] bg-white p-1.5">
                <QRCodeSVG value={qrUrl} size={54} level="M" includeMargin={false} bgColor="#FFFFFF" fgColor="#0F172A" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Business Profile</p>
          <p className="mt-1 break-words text-[17px] font-black leading-snug text-slate-900">{companyName}</p>
          {tagline && <p className="mt-1 text-[12px] leading-5 text-slate-500">{tagline}</p>}

          <div className="mt-4 grid gap-2.5 text-[12px] text-slate-700 sm:grid-cols-2">
            {email && (
              <div className="flex min-w-0 items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-[#2457F0]" />
                <span className="min-w-0 break-all">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex min-w-0 items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-[#2457F0]" />
                <span className="min-w-0 break-words">{phone}</span>
              </div>
            )}
            {website && (
              <div className="flex min-w-0 items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-[#2457F0]" />
                <span className="min-w-0 break-all">{website.replace(/^https?:\/\//, '')}</span>
              </div>
            )}
            {fullAddress && (
              <div className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2457F0]" />
                <span className="min-w-0 break-words leading-5">{fullAddress}</span>
              </div>
            )}
          </div>
        </div>

        {taxId && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 shrink-0 text-[#2457F0]" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{formData.taxType || 'GSTIN'}</span>
            </div>
            <span className="min-w-0 break-all text-right text-[12px] font-black text-slate-800">{taxId}</span>
          </div>
        )}
      </div>
    </div>
  );
}
