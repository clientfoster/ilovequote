import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Download,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { ItemQuoteItem } from '../types';
import { calculateQuotationTotals, formatCurrency } from '../itemUtils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PreviewStepProps {
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  businessWebsite?: string;
  businessAddress?: string;
  businessLogo?: string;
  businessSlug?: string;
  clientName: string;
  clientContactPerson?: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  quoteNumber: string;
  issueDate: string;
  expiryDate: string;
  items: ItemQuoteItem[];
  terms: string;
  remarks: string;
  onSaveDraft: () => void;
  onCopyLink: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onSendToClient: (email: string) => Promise<void>;
  onPrev: () => void;
}

const CURRENCY = '₹';

const formatPrettyDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
};

const getInitials = (value: string, fallback = 'Q') =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || fallback;

const parseTerms = (terms: string) =>
  terms
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[\.\)]\s*/, ''));

function computeLineValues(item: ItemQuoteItem) {
  const quantity = Math.max(0, item.quantity);
  const base = (item.complimentary ? 0 : item.price) * quantity;

  let discount = 0;
  if (!item.complimentary && item.discountType === 'Percentage') {
    discount = base * (Math.max(0, item.discountValue) / 100);
  } else if (!item.complimentary && item.discountType === 'Flat') {
    discount = Math.max(0, item.discountValue);
  }

  discount = Math.min(base, discount);
  const afterDiscount = base - discount;
  const tax = item.taxInclusive
    ? afterDiscount - afterDiscount / (1 + item.gstRate / 100)
    : afterDiscount * (Math.max(0, item.gstRate) / 100);

  return {
    quantity,
    base,
    discount,
    tax,
    amount: afterDiscount,
  };
}

export default function PreviewStep({
  businessName,
  businessEmail,
  businessPhone,
  businessWebsite,
  businessAddress,
  businessLogo,
  businessSlug,
  clientName,
  clientContactPerson,
  clientEmail,
  clientPhone,
  clientAddress,
  quoteNumber,
  issueDate,
  expiryDate,
  items,
  terms,
  remarks,
  onSaveDraft,
  onCopyLink,
  onPrint,
  onDownloadPDF,
  onSendToClient,
  onPrev,
}: PreviewStepProps) {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(clientEmail || '');
  const [sendStep, setSendStep] = useState<'idle' | 'rendering' | 'signing' | 'dispatching' | 'done'>('idle');
  const [saveToast, setSaveToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const totals = useMemo(() => calculateQuotationTotals(items), [items]);
  const hasDiscount = items.some((it) => it.discountType !== 'None' && it.discountValue > 0);
  const hasTax = items.some((it) => it.gstRate > 0);
  const showQuantity = items.some((it) => it.quantity !== 1) || hasDiscount || hasTax;
  const termsList = useMemo(() => parseTerms(terms), [terms]);

  const portfolioUrl = `${window.location.origin}/portfolio/${businessSlug || 'your-business'}`;
  const sharePayload = useMemo(() => {
    try {
      const payload = {
        businessName,
        businessEmail,
        businessPhone,
        businessWebsite,
        clientName,
        clientContactPerson,
        clientEmail,
        clientPhone,
        quoteNumber,
        issueDate,
        expiryDate,
        items,
        terms,
        remarks,
      };

      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    } catch {
      return '';
    }
  }, [
    businessName,
    businessEmail,
    businessPhone,
    businessWebsite,
    clientName,
    clientContactPerson,
    clientEmail,
    clientPhone,
    quoteNumber,
    issueDate,
    expiryDate,
    items,
    terms,
    remarks,
  ]);
  const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.hash.split('?')[0]}?data=${sharePayload}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // ignore clipboard failures and still surface the toast
    }

    setCopyToast(true);
    onCopyLink();
    window.setTimeout(() => setCopyToast(false), 2200);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello! Here is your quotation from ${businessName || 'our team'}. Quote Number: ${quoteNumber}. Review details here: ${shareUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const convertOklchToHsl = (oklchStr: string): string => {
    const match = oklchStr.match(/oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/i);
    if (!match) return 'rgba(37, 99, 235, 1)';
    
    const lVal = match[1];
    const cVal = match[2];
    const hVal = match[3];
    const aVal = match[4];
    
    const l = lVal.endsWith('%') ? parseFloat(lVal) : parseFloat(lVal) * 100;
    const c = cVal.endsWith('%') ? parseFloat(cVal) / 100 : parseFloat(cVal);
    const h = parseFloat(hVal);
    const a = aVal ? (aVal.endsWith('%') ? parseFloat(aVal) / 100 : parseFloat(aVal)) : 1;
    
    const s = Math.min(100, Math.round(c * 250));
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  };

  const convertOklabToHsl = (oklabStr: string): string => {
    const match = oklabStr.match(/oklab\(\s*([0-9.]+%?)\s+([-0-9.]+%?)\s+([-0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/i);
    if (!match) return 'rgba(255, 255, 255, 1)';
    
    const lVal = match[1];
    const aVal = match[4];
    
    const l = lVal.endsWith('%') ? parseFloat(lVal) : parseFloat(lVal) * 100;
    const a = aVal ? (aVal.endsWith('%') ? parseFloat(aVal) / 100 : parseFloat(aVal)) : 1;
    return `hsla(0, 0%, ${l}%, ${a})`;
  };

  const convertColorMix = (colorMixStr: string): string => {
    const lower = colorMixStr.toLowerCase();
    const pctMatch = colorMixStr.match(/([0-9.]+)%/);
    const alpha = pctMatch ? parseFloat(pctMatch[1]) / 100 : 0.5;

    if (lower.includes('transparent')) {
      if (lower.includes('white') || lower.includes('oklch(1 0 0)') || lower.includes('255, 255, 255') || lower.includes('hsla(0, 0%, 100%') || lower.includes('currentcolor')) {
        return `rgba(255, 255, 255, ${alpha})`;
      }
      if (lower.includes('black') || lower.includes('oklch(0 0 0)') || lower.includes('0, 0, 0')) {
        return `rgba(0, 0, 0, ${alpha})`;
      }
      return `rgba(37, 99, 235, ${alpha})`;
    }
    return 'rgb(37, 99, 235)';
  };

  const replaceUnsupportedCSS = (cssText: string): string => {
    let result = '';
    let i = 0;
    while (i < cssText.length) {
      if (cssText.substring(i, i + 6) === 'oklch(') {
        let depth = 1;
        let j = i + 6;
        while (j < cssText.length && depth > 0) {
          if (cssText[j] === '(') depth++;
          else if (cssText[j] === ')') depth--;
          j++;
        }
        const token = cssText.substring(i, j);
        result += convertOklchToHsl(token);
        i = j;
      } else if (cssText.substring(i, i + 6) === 'oklab(') {
        let depth = 1;
        let j = i + 6;
        while (j < cssText.length && depth > 0) {
          if (cssText[j] === '(') depth++;
          else if (cssText[j] === ')') depth--;
          j++;
        }
        const token = cssText.substring(i, j);
        result += convertOklabToHsl(token);
        i = j;
      } else if (cssText.substring(i, i + 10) === 'color-mix(') {
        let depth = 1;
        let j = i + 10;
        while (j < cssText.length && depth > 0) {
          if (cssText[j] === '(') depth++;
          else if (cssText[j] === ')') depth--;
          j++;
        }
        const token = cssText.substring(i, j);
        result += convertColorMix(token);
        i = j;
      } else {
        result += cssText[i];
        i++;
      }
    }
    return result;
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-capture-area');
    if (!element) {
      window.print();
      return;
    }

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Replace oklch, oklab, and color-mix in all style tags of the cloned document
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const tag = styleTags[i];
            if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab') || tag.innerHTML.includes('color-mix')) {
              tag.innerHTML = replaceUnsupportedCSS(tag.innerHTML);
            }
          }
          
          // Replace oklch, oklab, and color-mix in inline styles of all cloned elements
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            const styleAttr = el.getAttribute('style');
            if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix'))) {
              el.setAttribute('style', replaceUnsupportedCSS(styleAttr));
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`quotation_${quoteNumber || 'draft'}.pdf`);
    } catch (error: any) {
      console.error('Failed to generate PDF:', error);
      window.alert('PDF Generation failed: ' + (error?.message || error) + '. Falling back to browser print.');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const triggerSendSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendEmail.trim()) return;

    setSendStep('rendering');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSendStep('signing');
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSendStep('dispatching');
    await new Promise((resolve) => setTimeout(resolve, 900));
    await onSendToClient(sendEmail);
    setSendStep('done');
  };

  return (
    <div className="space-y-5 pb-24 md:pb-0" id="preview-step-panel">
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 text-white shadow-2xl no-print"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold">Draft successfully preserved</p>
              <p className="text-[10px] text-slate-400">All quotation details are saved to local storage.</p>
            </div>
            <button onClick={() => setSaveToast(false)} className="ml-2 text-slate-400 hover:text-white" type="button">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 text-white shadow-2xl no-print"
          >
            <Share2 className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs font-semibold">Shareable link copied</p>
              <p className="text-[10px] text-slate-400">The full quotation state is bundled in the copied URL.</p>
            </div>
            <button onClick={() => setCopyToast(false)} className="ml-2 text-slate-400 hover:text-white" type="button">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-full max-w-[980px] space-y-4 no-print">
        <div className="rounded-[28px] border border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur md:px-6 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-700 transition-colors hover:bg-slate-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            <div className="min-w-0 text-center">
              <h1 className="text-[22px] font-black tracking-tight text-slate-900 md:text-[28px]">Quote Preview</h1>
              <p className="mt-1 text-[13px] text-slate-500 md:text-[15px]">
                This is how your quote will look to your client
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-700 transition-colors hover:bg-slate-100"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-1.5 shadow-sm md:p-2 no-print">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-r border-slate-200 px-2 py-3 text-[11px] font-semibold text-[#1D4ED8] transition-colors hover:bg-blue-50 sm:gap-3 sm:px-4 sm:text-sm"
          >
            <Download className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-r border-slate-200 px-2 py-3 text-[11px] font-semibold text-[#1D4ED8] transition-colors hover:bg-blue-50 sm:gap-3 sm:px-4 sm:text-sm"
          >
            <Share2 className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-2 py-3 text-[11px] font-semibold text-slate-900 transition-colors hover:bg-emerald-50 sm:gap-3 sm:px-4 sm:text-sm"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600 sm:h-5 sm:w-5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[980px]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-sm md:p-6">
          <div id="invoice-capture-area" className="overflow-hidden rounded-[24px] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#07162d_0%,#0d1f43_45%,#17336a_100%)] px-5 py-5 text-white md:px-7 md:py-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.35),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.2),transparent_34%)]" />
              <div
                className="absolute bottom-0 left-1/2 h-16 w-16 -translate-x-1/2 bg-[#1d4ed8]"
                style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }}
              />
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(120deg,transparent_10%,rgba(255,255,255,0.08)_50%,transparent_90%)] opacity-70" />

              <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 md:h-16 md:w-16">
                    {businessLogo ? (
                      <img
                        src={businessLogo}
                        alt={`${businessName} logo`}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10 text-2xl font-black text-white">
                        {getInitials(businessName, 'B')}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-2xl font-black tracking-tight md:text-3xl">{businessName || 'SEMIXON'}</h2>
                    <div className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-white/90 md:text-[15px]">
                      {businessAddress && (
                        <p className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-white/75" />
                          <span>{businessAddress}</span>
                        </p>
                      )}
                      {businessEmail && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0 text-white/75" />
                          <span>{businessEmail}</span>
                        </p>
                      )}
                      {businessPhone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-white/75" />
                          <span>{businessPhone}</span>
                        </p>
                      )}
                      {businessWebsite && (
                        <p className="flex items-center gap-2">
                          <Globe className="h-4 w-4 shrink-0 text-white/75" />
                          <span>{businessWebsite}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Scan to view</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">our portfolio</p>
                  </div>

                  <div className="rounded-2xl bg-white p-2 shadow-lg">
                    <QRCodeSVG value={portfolioUrl} size={110} level="H" includeMargin={false} fgColor="#111827" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 bg-white px-4 py-5 md:px-8 md:py-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <h3 className="text-2xl font-black tracking-tight text-[#1D4ED8] md:text-[33px]">PRICE QUOTE</h3>

                <div className="text-right">
                  <p className="text-[22px] font-black tracking-tight text-[#1D4ED8] md:text-[30px]">{quoteNumber || 'Q-2024-001'}</p>
                  <p className="mt-1 text-sm text-slate-500 md:text-[15px]">{formatPrettyDate(issueDate)}</p>
                  <p className="text-sm text-slate-500 md:text-[15px]">Valid Until: {formatPrettyDate(expiryDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[150px_minmax(0,1fr)] md:items-center md:gap-6">
                <div className="text-sm font-medium text-slate-500 md:text-[15px]">Prepared For</div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_minmax(0,1.3fr)] md:items-start">
                  <div className="flex items-center justify-center rounded-[22px] border border-slate-100 bg-slate-50 px-6 py-8 md:min-h-[180px]">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-3xl font-black text-[#1D4ED8] shadow-sm">
                      {getInitials(clientName, 'C')}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[22px] border border-slate-100 bg-white px-5 py-4 md:border-0 md:px-0 md:py-0 md:pl-6 md:border-l md:border-slate-200">
                    <p className="text-lg font-black text-slate-900">{clientName || 'Client Company'}</p>
                    <p className="mt-1 text-sm text-slate-600">{clientContactPerson || 'Contact Person'}</p>
                    {clientEmail && <p className="mt-3 text-sm text-slate-600">{clientEmail}</p>}
                    {clientPhone && <p className="mt-2 text-sm text-slate-600">{clientPhone}</p>}
                    {clientAddress && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{clientAddress}</p>}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[18px] border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#1D4ED8] text-white">
                        <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider md:px-5">#</th>
                        <th className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider md:px-5">Item / Description</th>
                        {showQuantity && <th className="whitespace-nowrap px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider md:px-4">Qty</th>}
                        <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider md:px-5">Rate</th>
                        {hasDiscount && <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider md:px-5">Discount</th>}
                        {hasTax && <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider md:px-5">Tax (18%)</th>}
                        <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider md:px-5">Amount</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                      {items.length > 0 ? (
                        items.map((item, index) => {
                          const line = computeLineValues(item);

                          return (
                            <tr key={item.id} className="align-top">
                              <td className="px-4 py-4 text-center text-sm font-medium text-slate-600 md:px-5 md:py-5">{index + 1}</td>
                              <td className="px-4 py-4 md:px-5 md:py-5">
                                <div className="text-sm font-medium text-slate-900 md:text-base">{item.name}</div>
                                {item.description && (
                                  <div className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-500">
                                    {item.description}
                                  </div>
                                )}
                              </td>

                              {showQuantity && (
                                <td className="px-3 py-4 text-center text-sm font-medium text-slate-600 md:px-4 md:py-5">
                                  {line.quantity}
                                </td>
                              )}

                              <td className="px-4 py-4 text-right text-sm font-medium text-slate-700 md:px-5 md:py-5">
                                {formatCurrency(item.price, CURRENCY)}
                              </td>

                              {hasDiscount && (
                                <td className="px-4 py-4 text-center md:px-5 md:py-5">
                                  {line.discount > 0 ? (
                                    <div className="inline-flex flex-col items-center gap-1">
                                      <span className="rounded-lg bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                        {item.discountType === 'Percentage' ? `${item.discountValue}%` : 'Flat'}
                                      </span>
                                      <span className="text-sm font-medium text-emerald-600">
                                        -{formatCurrency(line.discount, CURRENCY)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              )}

                              {hasTax && (
                                <td className="px-4 py-4 text-center text-sm font-medium text-slate-700 md:px-5 md:py-5">
                                  {line.tax > 0 ? formatCurrency(line.tax, CURRENCY) : '-'}
                                </td>
                              )}

                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 md:px-5 md:py-5">
                                {formatCurrency(line.amount, CURRENCY)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={showQuantity && hasDiscount && hasTax ? 7 : showQuantity && (hasDiscount || hasTax) ? 6 : hasDiscount || hasTax ? 5 : 4}
                            className="px-4 py-8 text-center text-sm text-slate-400"
                          >
                            No line items listed. Please add items in the previous step.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-5 md:px-6 md:py-6">
                <div className="ml-auto max-w-[360px] space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-600">Sub Total</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(totals.subtotal, CURRENCY)}</span>
                  </div>

                  {totals.discountTotal > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-600">Total Discount</span>
                      <span className="font-semibold text-emerald-600">-{formatCurrency(totals.discountTotal, CURRENCY)}</span>
                    </div>
                  )}

                  {totals.gstTotal > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-600">Tax (18%)</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(totals.gstTotal, CURRENCY)}</span>
                    </div>
                  )}

                  <div className="my-3 border-t border-dashed border-slate-200" />

                  <div className="flex items-end justify-between gap-4">
                    <span className="text-lg font-black text-slate-900">Total</span>
                    <div className="text-right">
                      <div className="text-3xl font-black tracking-tight text-[#1D4ED8] md:text-[34px]">
                        {formatCurrency(totals.grandTotal, CURRENCY)}
                      </div>
                      {totals.gstTotal === 0 && <div className="mt-1 text-sm text-slate-500">(No Tax)</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-5 md:px-6 md:py-6">
                <h4 className="text-[18px] font-black text-slate-900">Terms & Conditions</h4>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
                  {termsList.length > 0 ? (
                    termsList.map((line) => (
                      <li key={line} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                        <span>{line}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500">No terms configured for this quote.</li>
                  )}
                </ul>
              </div>

              {remarks && (
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-600 md:px-6 md:py-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Notes</p>
                  <p className="mt-2">{remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[980px] no-print">
        <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-[#1D4ED8] bg-white px-4 text-base font-semibold text-slate-900 transition-colors hover:bg-blue-50"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#1D4ED8] px-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700"
            >
              <span>Next: Share Quote</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSendModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto no-print">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => sendStep === 'idle' && setIsSendModalOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-2xl md:p-8"
              >
                {sendStep === 'idle' && (
                  <form onSubmit={triggerSendSequence} className="space-y-4">
                    <div className="mb-1 flex items-center gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[#1D4ED8]">
                        <Share2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Transmit proposal directly to Client</h3>
                        <p className="text-[10px] text-slate-500">Relay a secure PDF quotation directly to the client's inbox.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Recipient Client Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="client@company.io"
                        value={sendEmail}
                        onChange={(e) => setSendEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono outline-none transition-all focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-50 pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsSendModalOpen(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-blue-700"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Transmit Now
                      </button>
                    </div>
                  </form>
                )}

                {sendStep !== 'idle' && (
                  <div className="space-y-4 py-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {sendStep === 'done' ? 'Quotation sent successfully' : 'Processing quotation...'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {sendStep === 'done' ? 'Your client should receive the quotation shortly.' : 'Preparing the final quotation package.'}
                    </p>
                    {sendStep === 'done' && (
                      <button
                        type="button"
                        onClick={() => setIsSendModalOpen(false)}
                        className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"
                      >
                        Close
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
