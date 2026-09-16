import React from 'react';
import { Mail, Phone, Globe, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BusinessFormValues, ClientFormValues } from '../../../types';

interface LivePreviewBoardProps {
  formData: BusinessFormValues;
  clientData?: Partial<ClientFormValues>;
  quoteNumber?: string;
  issueDate?: string;
  expiryDate?: string;
}

export default function LivePreviewBoard({
  formData,
  clientData,
  quoteNumber = 'Q-2026-00021',
  issueDate,
  expiryDate,
}: LivePreviewBoardProps) {
  const qrTargetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#/portfolio/${formData.businessSlug || 'your-business'}`
    : `https://ilovequote.com/#/portfolio/${formData.businessSlug || 'your-business'}`;

  const formattedAddress = [formData.city, formData.state, formData.country].filter(Boolean).join(', ');

  const todayStr = issueDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const validUntilStr = expiryDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-4 select-none" id="live-preview-board-root">
      {/* Header Tabs Label */}
      <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-widest text-slate-400 px-1">
        <span>LIVE PREVIEW</span>
        <span>QUOTE PREVIEW</span>
      </div>

      {/* Card 1: Business Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-start justify-between gap-4">
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {formData.logo ? (
              <img
                src={formData.logo}
                alt="Business Logo"
                className="w-12 h-12 rounded-2xl object-contain border border-slate-100 bg-white p-1 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                {formData.companyName ? formData.companyName.charAt(0).toUpperCase() : 'Y'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                {formData.companyName || 'Your Business'}
              </h3>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                {formData.tagline || 'Your tagline or description goes here'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-1">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span className="truncate">{formData.email || 'email@yourbusiness.com'}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Phone className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span className="truncate">{formData.phone || '+91 98765 43210'}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span className="truncate">{formData.website || 'www.yourwebsite.com'}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span className="truncate">{formattedAddress || 'City, State, Country'}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="shrink-0 p-2.5 bg-white rounded-xl border border-slate-150 shadow-xs flex flex-col items-center justify-center">
          <QRCodeSVG
            value={qrTargetUrl}
            size={84}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Card 2: Quote Preview Document */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between text-xs pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quote For</span>
            <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
              {clientData?.companyName || clientData?.contactPerson || 'Client Name'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quote #</span>
            <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
              {quoteNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Date</span>
            <span className="font-semibold text-slate-700">{todayStr}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 block">Valid Until</span>
            <span className="font-semibold text-slate-700">{validUntilStr}</span>
          </div>
        </div>

        {/* Table of Items */}
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <div className="bg-[#F0F5FF] px-3 py-2 grid grid-cols-12 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            <div className="col-span-6">Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="px-3 py-2.5 grid grid-cols-12 text-slate-600 font-medium">
              <div className="col-span-6 font-semibold text-slate-800 truncate">Item Name</div>
              <div className="col-span-2 text-center">1</div>
              <div className="col-span-2 text-right font-mono">₹0.00</div>
              <div className="col-span-2 text-right font-mono font-bold text-slate-800">₹0.00</div>
            </div>
            <div className="px-3 py-2.5 grid grid-cols-12 text-slate-600 font-medium">
              <div className="col-span-6 font-semibold text-slate-800 truncate">Item Name</div>
              <div className="col-span-2 text-center">1</div>
              <div className="col-span-2 text-right font-mono">₹0.00</div>
              <div className="col-span-2 text-right font-mono font-bold text-slate-800">₹0.00</div>
            </div>
            <div className="px-3 py-2.5 grid grid-cols-12 text-slate-600 font-medium">
              <div className="col-span-6 font-semibold text-slate-800 truncate">Item Name</div>
              <div className="col-span-2 text-center">1</div>
              <div className="col-span-2 text-right font-mono">₹0.00</div>
              <div className="col-span-2 text-right font-mono font-bold text-slate-800">₹0.00</div>
            </div>
          </div>
        </div>

        {/* Subtotal, Discount, Tax */}
        <div className="space-y-1.5 text-xs text-slate-500 pt-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-slate-700">₹0.00</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="font-mono font-semibold text-slate-700">₹0.00</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (0%)</span>
            <span className="font-mono font-semibold text-slate-700">₹0.00</span>
          </div>
        </div>

        {/* Total Highlight Bar */}
        <div className="bg-[#EBF3FF] text-[#1D4ED8] rounded-xl px-4 py-3 flex items-center justify-between font-extrabold text-base">
          <span>Total</span>
          <span className="font-mono">₹0.00</span>
        </div>
      </div>

      {/* Real-time Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 pt-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Preview updates in real-time</span>
      </div>

      {/* Tip Box */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
          ⓘ
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-800 mb-0.5">Tip</span>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Add your business details on the left. The preview will update automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
