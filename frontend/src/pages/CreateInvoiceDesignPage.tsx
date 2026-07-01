import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Mail, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { formatInvoiceCurrency, getInvoiceTotal, getLineItemAmount, useInvoiceDraft } from '../invoiceDraft';

const steps = [
  { number: '1', label: 'Invoice Details', active: false },
  { number: '2', label: 'Your Bank Details', active: false, optional: true },
  { number: '3', label: 'Select Design & Colors', active: true, subtitle: '(Download or Email Invoice)' },
];

export default function CreateInvoiceDesignPage() {
  const navigate = useNavigate();
  const [draft] = useInvoiceDraft();
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const total = getInvoiceTotal(draft);

  const handleDownloadPdf = async () => {
    if (!previewRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      const fileName = `${draft.invoiceNumber || 'invoice'}.pdf`;
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: previewRef.current.scrollWidth,
        windowHeight: previewRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const availableWidth = pageWidth - margin * 2;
      const renderHeight = (canvas.height * availableWidth) / canvas.width;

      if (renderHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, renderHeight, undefined, 'FAST');
      } else {
        const ratio = availableWidth / canvas.width;
        const pageCanvasHeight = Math.floor((pageHeight - margin * 2) / ratio);
        let renderedHeight = 0;
        let page = 0;

        while (renderedHeight < canvas.height) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
          const ctx = pageCanvas.getContext('2d');
          if (!ctx) break;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            canvas.width,
            pageCanvas.height,
          );

          const pageImg = pageCanvas.toDataURL('image/png');
          const pageRenderHeight = pageCanvas.height * ratio;

          if (page > 0) pdf.addPage();
          pdf.addImage(pageImg, 'PNG', margin, margin, availableWidth, pageRenderHeight, undefined, 'FAST');

          renderedHeight += pageCanvas.height;
          page += 1;
        }
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Failed to download invoice PDF', error);
      window.alert('Could not download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFF] px-3 py-4 md:px-5 md:py-6">
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
              <button className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">
                <Mail className="h-4 w-4" />
                Email Invoice
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

          <div ref={previewRef} className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-8 bg-[#2E6EAB] px-8 py-8 text-white md:grid-cols-[1fr_1.15fr] md:px-12 md:py-10">
              <div>
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-xl border border-white/20 bg-white/5">
                  <div className="text-5xl leading-none">INV</div>
                </div>
                <h2 className="text-5xl font-light tracking-[-0.05em]">Invoice</h2>
                {draft.showSubtitle && draft.subtitle ? <div className="mt-4 text-lg text-white/85">{draft.subtitle}</div> : null}
              </div>

              <div className="space-y-4 md:pl-12">
                <div className="bg-[#76A4D6]/70 px-5 py-3 text-right text-2xl font-semibold">{draft.businessName || 'Your Company Name'}</div>
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
                    {[draft.billedToCompany, draft.billedToAddress, draft.billedToCity, draft.billedToCountry, draft.billedToPostal].map((line, index) => (
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
                </div>
              </div>

              <div className="mt-10 border-t-4 border-slate-300 pt-8">
                <div className="grid grid-cols-[0.85fr_2.8fr_0.55fr_0.8fr_0.6fr_0.9fr] gap-4 px-1 pb-3 text-[15px] font-black uppercase text-[#0F2F59]">
                  <div>Items</div><div>Description</div><div className="text-right">Quantity</div><div className="text-right">Price</div><div className="text-right">Tax</div><div className="text-right">Amount</div>
                </div>
                <div className="space-y-3">
                  {draft.lineItems.map((row) => (
                    <div key={row.id} className="grid grid-cols-[0.85fr_2.8fr_0.55fr_0.8fr_0.6fr_0.9fr] gap-4">
                      <div className="bg-[#F4F7FF] px-3 py-4 text-xl font-semibold text-[#6E89B4]">{row.name}</div>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-xl text-[#7E95BA]">{row.description}</div>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-right text-xl text-[#7E95BA]">{row.quantity}</div>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-right text-xl text-[#7E95BA]">{formatInvoiceCurrency(row.rate)}</div>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-right text-xl text-[#7E95BA]">{row.tax}%</div>
                      <div className="bg-[#F4F7FF] px-3 py-4 text-right text-xl text-[#7E95BA]">{formatInvoiceCurrency(getLineItemAmount(row))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-[1.65fr_1fr]">
              <div className="bg-[#CFE7FB] px-8 py-8 md:px-10">
                <div className="text-xl font-black uppercase text-[#0F2F59]">Notes:</div>
                <div className="mt-4 bg-[#DCEEFF] px-4 py-5 text-xl leading-9 text-[#5D78A4]">{draft.notes}</div>
                {draft.bankName || draft.upiId ? (
                  <div className="mt-6">
                    <div className="text-lg font-black uppercase text-[#0F2F59]">Payment Details:</div>
                    <div className="mt-3 bg-[#DCEEFF] px-4 py-5 text-lg leading-8 text-[#5D78A4]">
                      {draft.bankName ? <div>Bank: {draft.bankName}</div> : null}
                      {draft.accountNumber ? <div>Account No: {draft.accountNumber}</div> : null}
                      {draft.ifsc ? <div>IFSC: {draft.ifsc}</div> : null}
                      {draft.upiId ? <div>UPI: {draft.upiId}</div> : null}
                      {draft.paymentNotes ? <div className="mt-3">{draft.paymentNotes}</div> : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="bg-[#2E6EAB] px-8 py-8 text-white md:px-10">
                <div className="text-right text-xl font-black uppercase">Total</div>
                <div className="mt-5 bg-[#76A4D6]/70 px-5 py-4 text-right text-6xl font-semibold tracking-[-0.05em]">{formatInvoiceCurrency(total)}</div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-6 text-center text-lg text-slate-500">
              Powered by <span className="font-bold text-[#2E6EAB]">all</span> <span className="font-black text-slate-800">wave</span>
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
              <button className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#2E6EAB] px-6 text-sm font-bold text-white shadow-[0_12px_24px_rgba(46,110,171,0.22)]">
                Continue
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
