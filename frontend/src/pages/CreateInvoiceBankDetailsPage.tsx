import React from 'react';
import { BadgeIndianRupee, Building2, ChevronDown, ChevronLeft, ChevronRight, CirclePlus, Landmark, QrCode, ShieldCheck, Trash2, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceDraft } from '../invoiceDraft';

const steps = [
  { number: '1', label: 'Invoice Details', active: false, path: '/create-invoice' },
  { number: '2', label: 'Your Bank Details', active: true, optional: true, path: '/create-invoice/bank-details' },
  { number: '3', label: 'Select Design & Colors', active: false, subtitle: '(Download or Email Invoice)', path: '/create-invoice/design' },
];

function InputRow({
  label,
  value,
  onChange,
  icon,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex min-h-[48px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          {icon}
          <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent outline-none" />
        </div>
        {trailing}
      </div>
    </label>
  );
}

export default function CreateInvoiceBankDetailsPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useInvoiceDraft();
  const [isMobileStepsOpen, setIsMobileStepsOpen] = React.useState(false);
  const updateDraft = (patch: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...patch }));
  const handleQrUpload = (file?: File | null) => {
    if (!file) {
      updateDraft({ qrImageName: '', qrImageData: '' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateDraft({
        qrImageName: file.name,
        qrImageData: typeof reader.result === 'string' ? reader.result : '',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-full bg-[#F8FAFF] px-3 py-4 md:px-5 md:py-6">
      <div className="mx-auto max-w-[1380px] space-y-4 md:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm md:px-6 md:py-4">
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileStepsOpen((current) => !current)}
              className="flex w-full items-center gap-3"
              aria-expanded={isMobileStepsOpen}
              aria-label="Toggle invoice steps"
            >
              {steps.filter((step) => step.active).map((step) => (
                <React.Fragment key={step.number}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black ${step.active ? 'border-[#2E6EAB] bg-[#2E6EAB] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{step.number}</div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-slate-900">{step.label}</div>
                    {'optional' in step && step.optional ? <div className="text-[11px] font-medium text-slate-400 sm:hidden">Optional</div> : null}
                    {'subtitle' in step && step.subtitle ? <div className="hidden text-[11px] font-medium text-slate-400 sm:block">{step.subtitle}</div> : null}
                  </div>
                  <ChevronDown className={`ml-auto h-4 w-4 text-slate-400 transition-transform duration-200 ${isMobileStepsOpen ? 'rotate-180' : ''}`} />
                </React.Fragment>
              ))}
            </button>
            {isMobileStepsOpen ? (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {steps.map((step) => (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      setIsMobileStepsOpen(false);
                      navigate(step.path);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${step.active ? 'bg-[#EEF4FF]' : 'bg-transparent'}`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${step.active ? 'border-[#2E6EAB] bg-[#2E6EAB] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{step.number}</div>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-bold ${step.active ? 'text-[#1D4ED8]' : 'text-slate-700'}`}>{step.label}</div>
                      {'optional' in step && step.optional ? <div className="text-[10px] font-medium text-slate-400">Optional</div> : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="hidden flex-col gap-4 md:flex lg:flex-row lg:items-center lg:justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${step.active ? 'border-[#2E6EAB] bg-[#2E6EAB] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{step.number}</div>
                  <div className="pt-0.5">
                    <div className={`text-sm font-bold ${step.active ? 'text-slate-900' : 'text-slate-600'}`}>{step.label}</div>
                    {'optional' in step && step.optional ? <div className="text-xs text-slate-400">(Optional)</div> : null}
                    {'subtitle' in step && step.subtitle ? <div className="text-xs text-slate-400">{step.subtitle}</div> : null}
                  </div>
                </div>
                {index < steps.length - 1 ? <ChevronRight className="hidden h-5 w-5 text-slate-300 lg:block" /> : null}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white px-4 py-5 shadow-sm md:px-8 md:py-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="space-y-6">
              <div className="pt-1 text-center md:pt-0">
                <h1 className="text-[2.6rem] font-black leading-none tracking-[-0.04em] text-slate-900 md:text-4xl">Your Bank Details</h1>
                <p className="mt-2 text-sm text-slate-500">Optional banking details that will be used on the final invoice design.</p>
              </div>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#2E6EAB]"><Landmark className="h-5 w-5" /></div>
                    <div>
                      <h2 className="text-xl font-black tracking-[-0.03em] text-slate-900">Primary Bank</h2>
                      <p className="text-sm text-slate-500">Main account for invoice payments</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <InputRow label="Account Holder Name" value={draft.accountHolderName} onChange={(accountHolderName) => updateDraft({ accountHolderName })} icon={<WalletCards className="h-4 w-4 text-slate-400" />} />
                    <InputRow label="Bank Name" value={draft.bankName} onChange={(bankName) => updateDraft({ bankName })} icon={<Building2 className="h-4 w-4 text-slate-400" />} />
                    <InputRow label="Account Number" value={draft.accountNumber} onChange={(accountNumber) => updateDraft({ accountNumber })} icon={<BadgeIndianRupee className="h-4 w-4 text-slate-400" />} />
                    <InputRow label="IFSC Code" value={draft.ifsc} onChange={(ifsc) => updateDraft({ ifsc })} trailing={<CirclePlus className="h-4 w-4 text-[#2E6EAB]" />} />
                    <InputRow label="Branch Name" value={draft.branchName} onChange={(branchName) => updateDraft({ branchName })} />
                    <InputRow label="Account Type" value={draft.accountType} onChange={(accountType) => updateDraft({ accountType })} trailing={<ChevronDown className="h-4 w-4 text-slate-400" />} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#2E6EAB]"><QrCode className="h-5 w-5" /></div>
                    <div>
                      <h2 className="text-xl font-black tracking-[-0.03em] text-slate-900">UPI / QR Payment</h2>
                      <p className="text-sm text-slate-500">Alternative payment details for customers</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <InputRow label="UPI ID" value={draft.upiId} onChange={(upiId) => updateDraft({ upiId })} />
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                      <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 text-slate-300">
                        {draft.qrImageData ? (
                          <img src={draft.qrImageData} alt="QR code preview" className="h-full w-full object-contain" />
                        ) : (
                          <QrCode className="h-12 w-12" />
                        )}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-600">{draft.qrImageName || 'Upload QR Code'}</p>
                      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#2E6EAB] shadow-sm">
                        <CirclePlus className="h-4 w-4" />
                        Add QR Image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQrUpload(e.target.files?.[0] ?? null)} />
                      </label>
                      {draft.qrImageData ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleQrUpload(null)}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-500 shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove QR Image
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-[#2E6EAB]" />
                        <p className="text-sm leading-7 text-slate-500">If you leave bank details empty, the design preview can still render and simply omit those values.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.03em] text-slate-900">Additional Payment Notes</h2>
                    <p className="mt-1 text-sm text-slate-500">Shown near the payment section in your invoice preview.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDraft({ paymentNotes: `${draft.paymentNotes}\nAdditional note` })}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]"
                  >
                    <CirclePlus className="h-4 w-4" />
                    Add More Fields
                  </button>
                </div>
                <textarea value={draft.paymentNotes} onChange={(e) => updateDraft({ paymentNotes: e.target.value })} className="mt-4 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-7 text-slate-600 outline-none" />
              </section>

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
                <button type="button" onClick={() => navigate('/create-invoice')} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 shadow-sm"><ChevronLeft className="h-4 w-4" />Back</button>
                <div className="flex items-stretch rounded-xl bg-[#2E6EAB] shadow-[0_12px_24px_rgba(46,110,171,0.22)]">
                  <button type="button" onClick={() => navigate('/create-invoice/design')} className="inline-flex min-h-[50px] items-center justify-center px-8 text-sm font-bold text-white">Save & Continue</button>
                  <button type="button" className="border-l border-[#5D8CC0] px-4 text-white"><ChevronDown className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-500 shadow-sm xl:sticky xl:top-6 xl:h-fit">
              <h3 className="text-lg font-black tracking-[-0.03em] text-slate-900">Bank Details Preview</h3>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-slate-400">Bank</span><span className="font-semibold text-slate-700">{draft.bankName || '-'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400">A/C No.</span><span className="font-semibold text-slate-700">{draft.accountNumber || '-'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400">IFSC</span><span className="font-semibold text-slate-700">{draft.ifsc || '-'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400">UPI</span><span className="font-semibold text-slate-700">{draft.upiId || '-'}</span></div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
