import React from 'react';
import { Copy, QrCode, Smartphone, Sparkles, Share2, Link2 } from 'lucide-react';
import QRCodePreview from '../components/QRCodePreview';
import { DEFAULT_BUSINESS_VALUES } from '../wizard/WizardState';

const quickLinks = [
  { label: 'Copy Portfolio Link', icon: Link2 },
  { label: 'Share QR Code', icon: Share2 },
  { label: 'Open Portfolio Preview', icon: QrCode },
];

export default function QRPortfolioPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">QR Portfolio</h1>
          <p className="mt-2 text-[15px] text-slate-500">
            Generate a scannable portfolio QR that points to your business profile.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#EEF3FF] p-3 text-[#1650FF]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-extrabold text-slate-900">Smart QR Generator</h2>
                <p className="mt-1 text-[14px] text-[#4F46E5]">
                  Print customized visual QR sticker cards for your offices or retail shelves.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-[#FBFCFF] p-4 shadow-sm">
              <QRCodePreview formData={DEFAULT_BUSINESS_VALUES} />
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#EEF3FF] p-3 text-[#1650FF]">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[18px] font-extrabold text-slate-900">What clients see</h3>
                  <p className="mt-1 text-[14px] text-slate-500">
                    A clean portfolio page with your business details and action links.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-4 text-[14px] text-slate-700">
                  <span className="font-semibold text-slate-900">Portfolio URL:</span>{' '}
                  {`${window.location.origin}/portfolio/semixon`}
                </div>

                <div className="grid gap-3">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="flex items-center justify-between rounded-[14px] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-3 text-[14px] font-semibold text-slate-900">
                          <Icon className="h-4.5 w-4.5 text-[#1650FF]" />
                          {item.label}
                        </span>
                        <Copy className="h-4 w-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#EEF3FF] px-4 py-4 text-[13px] text-slate-700">
              Tip: your QR always points to the live portfolio page, so it stays useful even after quote updates.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
