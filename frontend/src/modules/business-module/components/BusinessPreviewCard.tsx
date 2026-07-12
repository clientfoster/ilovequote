import React from 'react';
import { Globe, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BusinessFormValues } from '../../../types';
import { buildAppUrl } from '../../../url';

interface BusinessPreviewCardProps {
  formData: Partial<BusinessFormValues>;
  clientName?: string;
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] leading-4 text-slate-500">
      <span className="text-[#3B5BDB]">{icon}</span>
      <span className="min-w-0 truncate">{text}</span>
    </div>
  );
}

export default function BusinessPreviewCard({ formData, clientName }: BusinessPreviewCardProps) {
  const companyName = formData.companyName || 'Your Business';
  const tagline = formData.tagline || 'Your tagline or description goes here';
  const email = formData.email || 'email@yourbusiness.com';
  const phone = formData.phone || '+91 98765 43210';
  const website = formData.website || 'www.yourwebsite.com';
  const address = [formData.city, formData.state, formData.country].filter(Boolean).join(', ') || 'City, State, Country';
  const logo = formData.logo || '';
  const qrUrl = buildAppUrl(`/portfolio/${formData.businessSlug || 'your-business'}`);
  const quoteItems = [
    { item: 'Item Name', qty: '1', price: '₹0.00', total: '₹0.00' },
    { item: 'Item Name', qty: '1', price: '₹0.00', total: '₹0.00' },
    { item: 'Item Name', qty: '1', price: '₹0.00', total: '₹0.00' },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-[18px] border border-slate-200 bg-white px-3.5 py-3.5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
        <div className="mb-3 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <span>Live Preview</span>
          <span>Quote Preview</span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#5E60F6_0%,#3B5BDB_100%)] text-white shadow-[0_10px_24px_rgba(59,91,219,0.24)]">
                {logo ? (
                  <img src={logo} alt={`${companyName} logo`} className="h-full w-full rounded-[12px] object-contain p-1.25" />
                ) : (
                  <span className="text-[16px] font-black">{companyName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold leading-tight text-slate-900">{companyName}</h2>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{tagline}</p>
              </div>
            </div>

            <div className="space-y-1 pt-0.5">
              <InfoRow icon={<Mail className="h-3.5 w-3.5" />} text={email} />
              <InfoRow icon={<Phone className="h-3.5 w-3.5" />} text={phone} />
              <InfoRow icon={<Globe className="h-3.5 w-3.5" />} text={website} />
              <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} text={address} />
            </div>
          </div>

          <div className="flex justify-center sm:justify-end">
            <div className="rounded-[14px] border border-slate-200 bg-white p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              <QRCodeSVG value={qrUrl} size={82} level="M" includeMargin={false} fgColor="#111827" bgColor="#FFFFFF" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#C9D8FF] bg-white shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
        <div className="border-b border-[#DDE6FF] px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">Quote For</p>
              <p className="mt-0.5 text-[14px] font-semibold text-slate-900">{clientName || 'Client Name'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">Quote #</p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-900">Q-2026-00021</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-2">
            <div>
              <p className="text-slate-400">Date</p>
              <p className="mt-0.5 font-medium text-slate-900">21 May 2026</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Valid Until</p>
              <p className="mt-0.5 font-medium text-slate-900">20 Jun 2026</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#EEF3FF] text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <th className="px-3.5 py-2.5">Item</th>
                <th className="px-3.5 py-2.5 text-center">Qty</th>
                <th className="px-3.5 py-2.5 text-right">Price</th>
                <th className="px-3.5 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {quoteItems.map((row, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="px-3.5 py-2.5 text-[11px] text-slate-700">{row.item}</td>
                  <td className="px-3.5 py-2.5 text-center text-[11px] text-slate-700">{row.qty}</td>
                  <td className="px-3.5 py-2.5 text-right text-[11px] text-slate-700">{row.price}</td>
                  <td className="px-3.5 py-2.5 text-right text-[11px] text-slate-700">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1.5 px-3.5 py-3.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal</span>
            <span>₹0.00</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Discount</span>
            <span>₹0.00</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Tax (0%)</span>
            <span>₹0.00</span>
          </div>

          <div className="mt-2.5 flex items-center justify-between rounded-[12px] bg-[#EEF3FF] px-3.5 py-2.5">
            <span className="text-[14px] font-semibold text-slate-900">Total</span>
            <span className="text-[14px] font-semibold text-slate-900">₹0.00</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-emerald-600">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Preview updates in real-time
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-white px-3.5 py-3.5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] lg:hidden">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D7E2FF] bg-[#EEF3FF] text-[#3B5BDB]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-900">Tip</p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
              Add your business details on the left. The preview will update automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
