import React from 'react';
import { Globe, Mail, MapPin, Phone, Receipt } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BusinessFormValues } from '../../../types';

interface BusinessPreviewCardProps {
  formData: Partial<BusinessFormValues>;
}

export default function BusinessPreviewCard({ formData }: BusinessPreviewCardProps) {
  const companyName = formData.companyName || 'Semixon';
  const tagline = formData.tagline || 'my first quotation';
  const email = formData.email || 'hello@semixon.com';
  const phone = formData.phone || '+91 98765 43210';
  const website = formData.website || 'https://www.semixon.com';
  const address = formData.address || '123, Digital Tower, Kerala, India';
  const taxId = formData.taxId || '32ABCDE1234F1Z5';
  const portfolioSlug = formData.businessSlug || 'semixon';
  const qrUrl = `${window.location.origin}/portfolio/${portfolioSlug}`;
  const logo = formData.logo || '';

  return (
    <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
      <div className="bg-[#0A0C14] px-4 pb-3 pt-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white">
              {logo ? (
                <img src={logo} alt={`${companyName} logo`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white">
                  <span className="text-[16px] font-black leading-none text-[#2457F0]">S</span>
                </div>
              )}
            </div>
            <div className="pt-0.5">
              <p className="text-[18px] font-black leading-none tracking-[-0.03em]">
                {companyName.toUpperCase()}
              </p>
              <p className="mt-4 max-w-[230px] text-[13px] leading-5 text-white/90">{tagline}</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="mb-1 text-center text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-white/92">
              Scan to view
              <br />
              our portfolio
            </p>
            <div className="rounded-[20px] bg-white/8 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
              <div className="flex h-[82px] w-[82px] items-center justify-center rounded-[18px] bg-white p-2">
                <QRCodeSVG value={qrUrl} size={58} level="M" includeMargin={false} bgColor="#FFFFFF" fgColor="#0F172A" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white/8">
          <div className="h-full w-[114px] rounded-full bg-[#2457F0]" />
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">From</p>
            <p className="mt-1 text-[15px] font-semibold text-[#2457F0]">{companyName}</p>
            <p className="mt-2 text-[12px] leading-5 text-slate-600">{tagline}</p>

            <div className="mt-3 space-y-1.5 text-[12px] text-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-[#2457F0]" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-[#2457F0]" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-[#2457F0]" />
                <span>{website.replace(/^https?:\/\//, '')}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2457F0]" />
                <span>{address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#2457F0]" />
            <span className="text-[12px] font-semibold text-slate-700">GSTIN</span>
          </div>
          <span className="text-[12px] font-semibold text-slate-800">{taxId}</span>
        </div>
      </div>
    </div>
  );
}
