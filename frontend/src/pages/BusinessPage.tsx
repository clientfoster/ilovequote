import React, { useEffect, useState } from 'react';
import {
  Building2,
  ChevronDown,
  Upload,
} from 'lucide-react';
import BusinessPreviewCard from '../modules/business-module/components/BusinessPreviewCard';
import { DEFAULT_BUSINESS_VALUES, BUSINESS_DRAFT_KEY } from '../wizard/WizardState';
import { getScopedStorageKey } from '../auth';

const fieldShell =
  'w-full rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-[#334155] outline-none shadow-sm';

export default function BusinessPage() {
  const [business, setBusiness] = useState(DEFAULT_BUSINESS_VALUES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getScopedStorageKey(BUSINESS_DRAFT_KEY));
      if (raw) {
        setBusiness({ ...DEFAULT_BUSINESS_VALUES, ...JSON.parse(raw) });
      }
    } catch {
      setBusiness(DEFAULT_BUSINESS_VALUES);
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Create Quote</h1>
            <p className="mt-2 text-[15px] text-slate-500">
              Add your business details that will appear on the quote.
            </p>
          </div>

          <button className="inline-flex items-center gap-2 rounded-xl bg-[#1650FF] px-5 py-3 text-[14px] font-semibold text-white shadow-sm">
            <span className="text-[15px]">💾</span>
            Save
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#EEF3FF] p-3 text-[#1650FF]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-extrabold text-slate-900">Business Information</h2>
                <p className="mt-1 text-[14px] text-[#4F46E5]">
                  Add your business details that will appear on the quote
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className={fieldShell}>{business.companyName || ''}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-slate-700">Tagline / Business Description</label>
                  <span className="text-[11px] text-slate-400">(Optional)</span>
                </div>
                <div className={fieldShell}>{business.tagline || ''}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-slate-700">Email</label>
                    <span className="text-[11px] text-slate-400">(Optional)</span>
                  </div>
                  <div className={fieldShell}>{business.email || ''}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-slate-700">Phone</label>
                    <span className="text-[11px] text-slate-400">(Optional)</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-[#334155] shadow-sm">
                    <span className="text-[18px]">🇮🇳</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                    <span className="ml-2">{business.phone || ''}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-slate-700">Website</label>
                  <span className="text-[11px] text-slate-400">(Optional)</span>
                </div>
                <div className={fieldShell}>{business.website || ''}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-slate-700">Business Logo</label>
                  <span className="text-[11px] text-slate-400">(Optional)</span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-3 rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1650FF]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900">Upload Logo</p>
                    <p className="text-[12px] text-slate-500">PNG, JPG (Recommended: 200x200px)</p>
                  </div>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-slate-700">Business Address</label>
                  <span className="text-[11px] text-slate-400">(Optional)</span>
                </div>
                <div className={`${fieldShell} min-h-[92px]`}>{business.address || ''}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">City</label>
                    <div className={fieldShell}>{business.city || ''}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">State</label>
                    <div className={fieldShell}>{business.state || ''}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">PIN / ZIP Code</label>
                    <div className={fieldShell}>{business.zipCode || ''}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Country</label>
                  <div className="flex items-center justify-between rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-[#334155] shadow-sm">
                    <span>{business.country || ''}</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <h3 className="text-[13px] font-semibold text-slate-900">Tax Information</h3>
                <p className="text-[12px] text-[#4F46E5]">Add your tax details if applicable</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Tax ID Type</label>
                  <div className="flex items-center justify-between rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-[#334155] shadow-sm">
                    <span>{business.taxType || 'Select Tax ID Type'}</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Tax ID / GST Number</label>
                  <div className={fieldShell}>{business.taxId || ''}</div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <h3 className="text-[13px] font-semibold text-slate-900">Business Social Links</h3>
                <p className="text-[12px] text-[#4F46E5]">Add links to your social media or other profiles</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(business.socialLinks || []).length > 0 ? (
                  business.socialLinks.map((link) => (
                    <div
                      key={`${link.platform}-${link.url}`}
                      className="flex items-center gap-3 rounded-[10px] border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF3FF] text-[12px] font-bold uppercase text-[#1650FF]">
                        {link.platform.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1 truncate text-[14px] text-slate-700">{link.url}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[10px] border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No social links saved yet.
                  </div>
                )}
              </div>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white py-3 text-[14px] font-semibold text-[#1650FF] shadow-sm"
              >
                + Add More
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[18px] font-extrabold text-slate-900">Preview</h2>
          <p className="mt-1 text-[14px] text-[#4F46E5]">
            This is how your business details will appear on the quote
          </p>
          <div className="mt-4">
            <BusinessPreviewCard formData={business} />
          </div>
        </section>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-[#EEF3FF] px-4 py-3 text-[13px] text-slate-700 shadow-sm">
          <span className="font-semibold text-[#1650FF]">i</span> All fields except Company Name are optional.
        </div>
      </div>
    </div>
  );
}
