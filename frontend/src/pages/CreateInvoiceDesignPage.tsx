import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, MoreHorizontal, ShieldCheck, Upload, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatInvoiceCurrency, getInvoiceTotal, getLineItemAmount, saveInvoiceDraft, useInvoiceDraft } from '../invoiceDraft';
import { createInvoice } from '../invoiceApi';
import { AUTH_STATE_EVENT, isAuthenticated } from '../auth';
import { downloadElementAsPdf } from '../download';

const steps = [
  { number: '1', label: 'Invoice Details', active: false },
  { number: '2', label: 'Your Bank Details', active: false, optional: true },
  { number: '3', label: 'Select Design & Colors', active: true, subtitle: '(Download or Email Invoice)' },
];

export default function CreateInvoiceDesignPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [draft] = useInvoiceDraft();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthed, setIsAuthed] = useState(isAuthenticated());
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const autoSaveAfterLoginHandledRef = useRef(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const total = getInvoiceTotal(draft, draft.showTax);
  const visibleCustomFields = draft.customFields.filter((field) => field.value.trim());
  const visibleAttachments = draft.attachments.filter((attachment) => attachment.name.trim());
  const hasSignature = Boolean(draft.signatureData || draft.signatureName.trim());
  const lineItemGridClass = draft.showTax
    ? 'grid-cols-[0.85fr_2.8fr_0.55fr_0.8fr_0.6fr_0.9fr]'
    : 'grid-cols-[0.85fr_2.8fr_0.55fr_0.8fr_0.9fr]';

  useEffect(() => {
    const syncAuth = () => setIsAuthed(isAuthenticated());
    window.addEventListener(AUTH_STATE_EVENT, syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener(AUTH_STATE_EVENT, syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const buildAfterLoginReturnTo = () => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('afterLogin', 'saveInvoice');
    const search = searchParams.toString();
    return `${location.pathname}${search ? `?${search}` : ''}`;
  };

  useEffect(() => {
    if (!isAuthed) {
      autoSaveAfterLoginHandledRef.current = false;
      return;
    }

    const afterLoginAction = new URLSearchParams(location.search).get('afterLogin');
    if (afterLoginAction !== 'saveInvoice' || autoSaveAfterLoginHandledRef.current) return;

    autoSaveAfterLoginHandledRef.current = true;
    navigate(location.pathname, { replace: true });
    void handleSaveInvoice();
  }, [isAuthed, location.pathname, location.search, navigate]);

  const handleDownloadPdf = async () => {
    if (!previewRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      const fileName = `${draft.invoiceNumber || 'invoice'}.pdf`;
      await downloadElementAsPdf(previewRef.current, fileName);
    } catch (error) {
      console.error('Failed to download invoice PDF', error);
      window.alert('Could not download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!isAuthed) {
      saveInvoiceDraft(draft);
      setShowAuthPrompt(true);
      return;
    }

    try {
      setIsSaving(true);
      await createInvoice({
        ...draft,
        status: 'Completed',
      });
      navigate('/invoices');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not save invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFF] px-3 py-4 md:px-5 md:py-6">
      {showAuthPrompt ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" onClick={() => setShowAuthPrompt(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" aria-label="Close save prompt" />
          <div className="relative z-10 w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:p-7">
            <button
              type="button"
              onClick={() => setShowAuthPrompt(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2457F0]">
              <ShieldCheck size={26} />
            </div>

            <h2 className="mt-5 text-[24px] font-black tracking-tight text-slate-950">
              Create account or sign in to save this invoice
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-600">
              Sign in to save this invoice to your records history and reuse it later from your account.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  saveInvoiceDraft(draft);
                  navigate(`/login?mode=signup&returnTo=${encodeURIComponent(buildAfterLoginReturnTo())}`);
                }}
                className="inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-[#2457F0] px-5 text-[15px] font-bold text-white shadow-[0_14px_28px_rgba(36,87,240,0.24)] transition hover:bg-[#1d4ed8]"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  saveInvoiceDraft(draft);
                  navigate(`/login?mode=login&returnTo=${encodeURIComponent(buildAfterLoginReturnTo())}`);
                }}
                className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-[15px] font-bold text-slate-900 transition hover:bg-slate-50"
              >
                Sign In
              </button>
            </div>

            <p className="mt-4 text-center text-[12px] font-medium text-slate-400">
              Your invoice will only be added to history after you log in.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1380px] space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
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

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-900 md:text-3xl">Invoice Design Preview</h1>
              <p className="mt-1 text-sm text-slate-500">Live preview using the details entered in the previous steps.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={isSaving}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Invoice'}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2E6EAB] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(46,110,171,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[794px] overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm">
            <div ref={previewRef} className="quote-pdf-surface mx-auto w-full overflow-hidden bg-white">
            <div className="grid gap-8 bg-[#2E6EAB] px-8 py-8 text-white md:grid-cols-[1fr_1.15fr] md:px-12 md:py-10">
              <div>
                <div className="mb-8 flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/5">
                  {draft.logoData ? (
                    <img src={draft.logoData} alt="Business logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="text-5xl leading-none">INV</div>
                  )}
                </div>
                <h2 className="text-5xl font-light tracking-[-0.05em]">Invoice</h2>
                {draft.showSubtitle && draft.subtitle ? <div className="mt-4 text-lg text-white/85">{draft.subtitle}</div> : null}
              </div>

              <div className="space-y-4 md:pl-12">
                <div className="bg-[#76A4D6]/70 px-5 py-3 text-right text-2xl font-semibold">{draft.businessName || 'Your Company Name'}</div>
                <div className="bg-[#76A4D6]/70 px-5 py-2 text-right text-sm font-medium">{draft.businessPhone ? `Phone: ${draft.businessPhone}` : 'Phone: -'}</div>
                <div className="bg-[#76A4D6]/70 px-5 py-2 text-right text-sm font-medium">{draft.businessAddress || 'Your Business Address'}</div>
                <div className="bg-[#76A4D6]/70 px-5 py-2 text-right text-sm font-medium">{draft.businessCity || 'City'}</div>
                <div className="bg-[#76A4D6]/70 px-5 py-2 text-right text-sm font-medium">{draft.businessCountry || 'Country'}</div>
                <div className="bg-[#76A4D6]/70 px-5 py-2 text-right text-sm font-medium">{draft.businessPostal || 'Postal'}</div>
              </div>
            </div>

            <div className="bg-white px-8 py-8 md:px-10">
              <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="text-lg font-black text-[#0F2F59]">BILL TO:</div>
                  <div className="mt-2 space-y-2">
                    {[draft.billedToCompany, draft.billedToPhone ? `Phone: ${draft.billedToPhone}` : 'Phone: -', draft.billedToAddress, draft.billedToCity, draft.billedToCountry, draft.billedToPostal].map((line, index) => (
                      <div key={`${line}-${index}`} className={`px-3 py-2 text-[#5D78A4] ${index === 0 ? 'bg-[#EEF3FF] text-2xl' : 'bg-[#F4F7FF] text-lg'}`}>
                        {line || '-'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 text-right">
                  {[
                    ['INVOICE #', draft.invoiceNumber],
                    ['DATE', draft.invoiceDate],
                    ['INVOICE DUE DATE', draft.showDueDate ? draft.dueDate : '-'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-lg font-black text-[#0F2F59]">{label}</div>
                      <div className="mt-2 bg-[#F4F7FF] px-3 py-2 text-2xl text-[#6E89B4]">{value}</div>
                    </div>
                  ))}
                  {visibleCustomFields.map((field) => (
                    <div key={field.id}>
                      <div className="text-lg font-black uppercase text-[#0F2F59]">{field.label || 'Custom Field'}</div>
                      <div className="mt-2 bg-[#F4F7FF] px-3 py-2 text-2xl text-[#6E89B4]">{field.value || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 border-t-4 border-slate-300 pt-8">
                <div className={`grid ${lineItemGridClass} gap-4 px-1 pb-3 text-[15px] font-black uppercase text-[#0F2F59]`}>
                  <div>Items</div><div>Description</div><div className="text-right">Quantity</div><div className="text-right">Price</div>{draft.showTax ? <div className="text-right">Tax</div> : null}<div className="text-right">Amount</div>
                </div>
                <div className="space-y-3">
                  {draft.lineItems.map((row) => (
                    <div key={row.id} className={`grid ${lineItemGridClass} gap-4`}>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-xl font-semibold text-[#6E89B4]">{row.name}</div>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-xl text-[#7E95BA]">{row.description}</div>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-right text-xl text-[#7E95BA]">{row.quantity}</div>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-right text-xl text-[#7E95BA]">{formatInvoiceCurrency(row.rate)}</div>
                      {draft.showTax ? <div className="bg-[#F4F7FF] px-3 py-4 text-right text-xl text-[#7E95BA]">{row.tax}%</div> : null}
                      <div className="bg-[#F4F7FF] px-3 py-4 text-right text-xl text-[#7E95BA]">{formatInvoiceCurrency(getLineItemAmount(row, draft.showTax))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-[1.65fr_1fr]">
              <div className="bg-[#CFE7FB] px-8 py-6 md:px-10">
                <div className="text-lg font-black uppercase text-[#0F2F59]">Notes:</div>
                <div className="mt-3 whitespace-pre-line bg-[#DCEEFF] px-4 py-4 text-base leading-7 text-[#5D78A4]">{draft.notes}</div>
                {visibleAttachments.length > 0 ? (
                  <div className="mt-5">
                    <div className="text-base font-black uppercase text-[#0F2F59]">Attachments:</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {visibleAttachments.map((attachment) => (
                        <div key={attachment.id} className="rounded-2xl bg-[#DCEEFF] px-4 py-3 text-[#5D78A4]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/80 text-[#2E6EAB] shadow-sm">
                              {attachment.dataUrl ? (
                                <img src={attachment.dataUrl} alt={attachment.name} className="h-full w-full object-cover" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-[#0F2F59]">{attachment.name}</div>
                              <div className="text-xs leading-5 text-[#5D78A4]">{attachment.type || 'File attachment'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {draft.bankName || draft.upiId || draft.qrImageData ? (
                  <div className="mt-5">
                    <div className="text-base font-black uppercase text-[#0F2F59]">Payment Details:</div>
                    <div className="mt-3 flex flex-col gap-4 bg-[#DCEEFF] px-4 py-4 sm:flex-row sm:items-start">
                      {draft.qrImageData ? (
                        <div className="shrink-0 rounded-2xl bg-white p-3 shadow-sm">
                          <img src={draft.qrImageData} alt="Payment QR code" className="h-28 w-28 object-contain" />
                        </div>
                      ) : null}
                      <div className="text-base leading-7 text-[#5D78A4]">
                        {draft.bankName ? <div>Bank: {draft.bankName}</div> : null}
                        {draft.accountNumber ? <div>Account No: {draft.accountNumber}</div> : null}
                        {draft.ifsc ? <div>IFSC: {draft.ifsc}</div> : null}
                        {draft.upiId ? <div>UPI: {draft.upiId}</div> : null}
                        {draft.paymentNotes ? <div className="mt-3">{draft.paymentNotes}</div> : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="bg-[#2E6EAB] px-8 py-6 text-white md:px-10">
                <div className="ml-auto w-full max-w-[260px]">
                  <div className="text-right text-sm font-black uppercase tracking-[0.16em] text-white/90">Total</div>
                  <div className="mt-3 rounded-xl bg-[#76A4D6]/70 px-5 py-3 text-right text-5xl font-semibold tracking-[-0.05em]">{formatInvoiceCurrency(total)}</div>
                </div>
                {hasSignature ? (
                  <div className="mt-8 ml-auto w-full max-w-[300px] text-white">
                    <div className="text-right text-base font-black uppercase tracking-[0.12em] text-white/90">Signature:</div>
                    <div className="mt-4 flex w-full justify-end">
                      {draft.signatureData ? (
                        <img src={draft.signatureData} alt="Signature preview" className="max-h-20 w-auto max-w-[180px] object-contain" />
                      ) : null}
                    </div>
                    <div className="mt-2 text-right text-sm font-semibold text-white/90">
                        {draft.signatureName || 'Authorized Signatory'}
                      </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-6 text-center text-lg text-slate-500">
              Powered by <span className="font-black text-[#2E6EAB]">iLoveQuote</span>
            </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
            <button onClick={() => navigate('/create-invoice/bank-details')} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 shadow-sm">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex gap-3">
              <button onClick={() => navigate('/create-invoice')} className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm">
                Change Template
              </button>
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={isSaving}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#2E6EAB] px-6 text-sm font-bold text-white shadow-[0_12px_24px_rgba(46,110,171,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Invoice'}
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
