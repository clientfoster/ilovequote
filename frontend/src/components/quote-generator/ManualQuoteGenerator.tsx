import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  Building2,
  Users,
  FileText,
  ListFilter,
  FileEdit,
  Eye,
  Download,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Camera,
  Mic,
  FileSpreadsheet,
  Check,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Layers,
  ArrowRight,
  Printer,
  Sparkles,
  Share2,
  Settings,
  Truck,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';

function numberToIndianWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const intVal = Math.floor(num || 0);
  if (intVal === 0) return 'Zero Rupees Only';

  const convert2 = (n: number): string => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  };

  const convert3 = (n: number): string => {
    if (n >= 100) {
      return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert2(n % 100) : '');
    }
    return convert2(n);
  };

  let str = '';
  const crore = Math.floor(intVal / 10000000);
  let rem = intVal % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (crore > 0) str += convert3(crore) + ' Crore ';
  if (lakh > 0) str += convert3(lakh) + ' Lakh ';
  if (thousand > 0) str += convert3(thousand) + ' Thousand ';
  if (rem > 0) str += convert3(rem) + ' ';

  return (str.trim() + ' Rupees Only');
}
import {
  StructuredQuote,
  StructuredQuoteItem,
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  createDefaultStructuredQuote,
  calculateStructuredQuotePricing,
  convertQuoteToInvoiceDraft,
  TaxConfiguration,
  QuoteColumnConfig,
  ShippingDetails,
  DEFAULT_COLUMNS,
  DEFAULT_TAX_CONFIG,
  DEFAULT_SHIPPING_DETAILS,
} from '../../types/structuredQuote';
import PhotoQuoteExtractor from './PhotoQuoteExtractor';
import AudioQuoteExtractor from './AudioQuoteExtractor';
import TaxConfigModal from './TaxConfigModal';
import ColumnFormulaModal from './ColumnFormulaModal';
import BrandMark from '../BrandMark';
import { isAuthenticated } from '../../auth';

const STORAGE_KEY = 'ilovequote_structured_quote_draft_v1';
const INVOICE_STORAGE_KEY = 'ilovequote_invoice_draft_v1';

export default function ManualQuoteGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const printableDocRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [quote, setQuote] = useState<StructuredQuote>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...createDefaultStructuredQuote(),
          ...parsed,
          shipping: { ...DEFAULT_SHIPPING_DETAILS, ...(parsed.shipping || {}) },
          taxConfig: { ...DEFAULT_TAX_CONFIG, ...(parsed.taxConfig || {}) },
          columns:
            parsed.columns && parsed.columns.length > 0
              ? parsed.columns
              : DEFAULT_COLUMNS.map((col) => ({ ...col })),
        };
      }
    } catch {
      // Fallback
    }
    return createDefaultStructuredQuote();
  });

  const [activeMode, setActiveMode] = useState<'manual' | 'photo' | 'audio'>('manual');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showTaxModal, setShowTaxModal] = useState<boolean>(false);
  const [showColumnModal, setShowColumnModal] = useState<boolean>(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState<boolean>(false);

  // Accordion open/close states
  const [openSections, setOpenSections] = useState<{
    business: boolean;
    client: boolean;
    quoteDetails: boolean;
    additionalOptions: boolean;
    items: boolean;
    notes: boolean;
  }>({
    business: true,
    client: true,
    quoteDetails: true,
    additionalOptions: true,
    items: true,
    notes: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Persist draft changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quote));
    } catch {
      // Storage unavailable
    }
  }, [quote]);

  // Listen for quotes passed via navigation state (e.g. from Voice & Text studio)
  useEffect(() => {
    if (location.state && (location.state as any).quote) {
      setQuote((location.state as any).quote);
      setOpenSections({
        business: true,
        client: true,
        quoteDetails: true,
        additionalOptions: true,
        items: true,
        notes: true,
      });
      setToastMessage('✓ Voice & Text Quotation loaded into UI Price Quote Dashboard!');
      setTimeout(() => setToastMessage(''), 4500);
    }
  }, [location.state]);

  // Recalculate totals whenever items, discount %, or tax % change
  const handleUpdateItem = (id: string, field: keyof StructuredQuoteItem, value: any) => {
    setQuote((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'unitPrice' || field === 'quantity') {
          const qty = Number(field === 'quantity' ? value : updated.quantity) || 0;
          const rate = Number(field === 'unitPrice' ? value : updated.unitPrice) || 0;
          updated.amount = Number((qty * rate).toFixed(2));
        }
        return updated;
      });

      const cessPercent = prev.taxConfig?.hasCess ? prev.taxConfig.cessPercent : 0;
      const newPricing = calculateStructuredQuotePricing(
        updatedItems,
        prev.pricing.discountPercent,
        prev.pricing.taxPercent,
        cessPercent
      );

      return {
        ...prev,
        items: updatedItems,
        pricing: newPricing,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAddItem = () => {
    setQuote((prev) => {
      const newItem: StructuredQuoteItem = {
        id: `item-${Date.now()}-${prev.items.length + 1}`,
        name: '',
        description: '',
        unitPrice: 0,
        quantity: 1,
        amount: 0,
      };
      const updatedItems = [...prev.items, newItem];
      const cessPercent = prev.taxConfig?.hasCess ? prev.taxConfig.cessPercent : 0;
      const newPricing = calculateStructuredQuotePricing(
        updatedItems,
        prev.pricing.discountPercent,
        prev.pricing.taxPercent,
        cessPercent
      );
      return {
        ...prev,
        items: updatedItems,
        pricing: newPricing,
      };
    });
  };

  const handleRemoveItem = (id: string) => {
    setQuote((prev) => {
      const updatedItems = prev.items.filter((item) => item.id !== id);
      const cessPercent = prev.taxConfig?.hasCess ? prev.taxConfig.cessPercent : 0;
      const newPricing = calculateStructuredQuotePricing(
        updatedItems,
        prev.pricing.discountPercent,
        prev.pricing.taxPercent,
        cessPercent
      );
      return {
        ...prev,
        items: updatedItems,
        pricing: newPricing,
      };
    });
  };

  const handleDiscountChange = (val: number) => {
    setQuote((prev) => {
      const cessPercent = prev.taxConfig?.hasCess ? prev.taxConfig.cessPercent : 0;
      const newPricing = calculateStructuredQuotePricing(
        prev.items,
        val,
        prev.pricing.taxPercent,
        cessPercent
      );
      return {
        ...prev,
        pricing: newPricing,
      };
    });
  };

  const handleTaxChange = (val: number) => {
    setQuote((prev) => {
      const cessPercent = prev.taxConfig?.hasCess ? prev.taxConfig.cessPercent : 0;
      const newPricing = calculateStructuredQuotePricing(
        prev.items,
        prev.pricing.discountPercent,
        val,
        cessPercent
      );
      return {
        ...prev,
        pricing: newPricing,
      };
    });
  };

  const handleToggleShipping = (enabled: boolean) => {
    setQuote((prev) => ({
      ...prev,
      shipping: {
        ...(prev.shipping || DEFAULT_SHIPPING_DETAILS),
        enabled,
      },
    }));
  };

  const handleUpdateShipping = (field: keyof ShippingDetails, value: any) => {
    setQuote((prev) => ({
      ...prev,
      shipping: {
        ...(prev.shipping || DEFAULT_SHIPPING_DETAILS),
        [field]: value,
      },
    }));
  };

  const handleSaveTaxConfig = (newTaxConfig: TaxConfiguration) => {
    setQuote((prev) => {
      const cess = newTaxConfig.hasCess ? newTaxConfig.cessPercent : 0;
      const updatedPricing = calculateStructuredQuotePricing(
        prev.items,
        prev.pricing.discountPercent,
        prev.pricing.taxPercent,
        cess
      );
      return {
        ...prev,
        taxConfig: newTaxConfig,
        pricing: updatedPricing,
      };
    });
  };

  const handleSaveColumns = (newColumns: QuoteColumnConfig[]) => {
    setQuote((prev) => ({
      ...prev,
      columns: newColumns,
    }));
  };

  const handleSelectCurrency = (currency: CurrencyInfo) => {
    setQuote((prev) => ({ ...prev, currency }));
    setCurrencyDropdownOpen(false);
  };

  // Convert quote to invoice
  const handleConvertToInvoice = () => {
    const invoiceDraft = convertQuoteToInvoiceDraft(quote);
    try {
      localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoiceDraft));
    } catch {
      // Ignore
    }
    navigate('/create-invoice');
  };

  // Handle crisp direct A4 vector PDF Export
  const handleDownloadPdf = async () => {
    if (!printableDocRef.current || isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      const safeClient = (quote.client.name || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Quotation_${quote.quoteNumber}_${safeClient}.pdf`;

      const element = printableDocRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const renderHeight = (canvas.height * availableWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        availableWidth,
        Math.min(renderHeight, availableHeight),
        undefined,
        'FAST'
      );

      pdf.save(fileName);
      setToastMessage(`✓ PDF ${fileName} downloaded successfully!`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle applying extracted data from Photo, Voice, or Text
  const handleApplyExtractedData = (data: Partial<StructuredQuote>) => {
    setQuote((prev) => {
      const mergedItems = data.items && data.items.length > 0 ? data.items : prev.items;
      const newPricing = calculateStructuredQuotePricing(
        mergedItems,
        data.pricing?.discountPercent ?? prev.pricing.discountPercent,
        data.pricing?.taxPercent ?? prev.pricing.taxPercent
      );

      return {
        ...prev,
        ...data,
        business: {
          ...prev.business,
          ...(data.business || {}),
        },
        client: {
          ...prev.client,
          ...(data.client || {}),
        },
        items: mergedItems,
        pricing: newPricing,
        source: data.source || prev.source,
      };
    });
    setOpenSections({
      business: true,
      client: true,
      quoteDetails: true,
      additionalOptions: true,
      items: true,
      notes: true,
    });
    setToastMessage('✓ Voice & Text Quotation updated into UI Price Quote Dashboard!');
    setTimeout(() => setToastMessage(''), 4000);
    setActiveMode('manual');
  };

  const formatCurrency = (amount: number) => {
    return `${quote.currency.symbol}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns = quote.columns || DEFAULT_COLUMNS;
  const isColVisible = (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    return col ? col.visible : false;
  };
  const customColumns = columns.filter((c) => c.isCustom && c.visible);

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-6 lg:px-8">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BrandMark size="sm" showSubtext={false} />
            </div>

            <div className="flex items-center gap-3">
              {/* Currency Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-xs sm:text-sm font-semibold text-blue-900 transition-colors shadow-sm"
                >
                  <span>{quote.currency.flag || '🌐'}</span>
                  <span>{quote.currency.code} ({quote.currency.symbol})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-700" />
                </button>

                {currencyDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Select Currency
                    </div>
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => handleSelectCurrency(curr)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                          quote.currency.code === curr.code ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{curr.flag}</span>
                          <span>{curr.code} - {curr.name}</span>
                        </span>
                        <span className="font-mono text-gray-500">{curr.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isAuthenticated() && (
                <button
                  type="button"
                  onClick={() => navigate('/login?mode=signup')}
                  className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-xl bg-blue-950 hover:bg-black text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Sign Up
                </button>
              )}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="pt-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Create a Quote
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Create and download a professional quote — completely free with no account required.
            </p>
          </div>

          {/* 3 Mode Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
            {/* Mode 1: Create Manually */}
            <div
              onClick={() => setActiveMode('manual')}
              className={`relative rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border-2 cursor-pointer transition-all text-center sm:text-left ${
                activeMode === 'manual'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {activeMode === 'manual' && (
                <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                </div>
              )}
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1.5 sm:mb-2.5 mx-auto sm:mx-0">
                <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">Create Manually</h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 hidden xs:block truncate">Enter items & details</p>
            </div>

            {/* Mode 2: From Photo */}
            <div
              onClick={() => setActiveMode('photo')}
              className={`relative rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border-2 cursor-pointer transition-all text-center sm:text-left ${
                activeMode === 'photo'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {activeMode === 'photo' && (
                <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                </div>
              )}
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 sm:mb-2.5 mx-auto sm:mx-0">
                <Camera className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">From Photo</h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 hidden xs:block truncate">Upload bill/photo</p>
            </div>

            {/* Mode 3: Voice & Text AI */}
            <div
              onClick={() => setActiveMode('audio')}
              className={`relative rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border-2 cursor-pointer transition-all text-center sm:text-left ${
                activeMode === 'audio'
                  ? 'border-amber-600 bg-amber-50/40 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {activeMode === 'audio' && (
                <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                </div>
              )}
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5 sm:mb-2.5 mx-auto sm:mx-0">
                <Mic className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">Voice &amp; Text AI</h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 hidden xs:block truncate">Speak or type prompt</p>
            </div>
          </div>

          {/* Action Buttons: Preview Quote & Direct Download PDF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Eye className="w-4 h-4 text-blue-700" />
              Preview Quote
            </button>

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleDownloadPdf}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-black hover:to-slate-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Mode Views for Photo and Audio */}
        {activeMode === 'photo' && (
          <PhotoQuoteExtractor
            onApplyExtractedData={handleApplyExtractedData}
            onCancel={() => setActiveMode('manual')}
          />
        )}

        {activeMode === 'audio' && (
          <AudioQuoteExtractor
            onApplyExtractedData={handleApplyExtractedData}
            onCancel={() => setActiveMode('manual')}
          />
        )}

        {/* 5 Structured Accordions */}
        <div className="space-y-4">
          {/* Accordion 1: Your Business */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div
              onClick={() => toggleSection('business')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Your Business</h2>
                  <p className="text-xs text-gray-500">Add your business details that will appear on the quote</p>
                </div>
              </div>
              {openSections.business ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {openSections.business && (
              <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Your business name"
                      value={quote.business.name}
                      onChange={(e) =>
                        setQuote((prev) => ({
                          ...prev,
                          business: { ...prev.business, name: e.target.value },
                        }))
                      }
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Prepared By <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Venkat Katari"
                        value={quote.business.preparedBy}
                        onChange={(e) =>
                          setQuote((prev) => ({
                            ...prev,
                            business: { ...prev.business, preparedBy: e.target.value },
                          }))
                        }
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Street address, city, state"
                      value={quote.business.address}
                      onChange={(e) =>
                        setQuote((prev) => ({
                          ...prev,
                          business: { ...prev.business, address: e.target.value },
                        }))
                      }
                      className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={quote.business.phone}
                        onChange={(e) =>
                          setQuote((prev) => ({
                            ...prev,
                            business: { ...prev.business, phone: e.target.value },
                          }))
                        }
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={quote.business.email}
                        onChange={(e) =>
                          setQuote((prev) => ({
                            ...prev,
                            business: { ...prev.business, email: e.target.value },
                          }))
                        }
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Website <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="www.yourcompany.com"
                        value={quote.business.website}
                        onChange={(e) =>
                          setQuote((prev) => ({
                            ...prev,
                            business: { ...prev.business, website: e.target.value },
                          }))
                        }
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Client Details */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div
              onClick={() => toggleSection('client')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Client Details</h2>
                  <p className="text-xs text-gray-500">Add your client or customer details</p>
                </div>
              </div>
              {openSections.client ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {openSections.client && (
              <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Client / Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Client name"
                      value={quote.client.name}
                      onChange={(e) =>
                        setQuote((prev) => ({
                          ...prev,
                          client: { ...prev.client, name: e.target.value },
                        }))
                      }
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Person <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={quote.client.contactPerson}
                        onChange={(e) =>
                          setQuote((prev) => ({
                            ...prev,
                            client: { ...prev.client, contactPerson: e.target.value },
                          }))
                        }
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Street address, city, state"
                      value={quote.client.address}
                      onChange={(e) =>
                        setQuote((prev) => ({
                          ...prev,
                          client: { ...prev.client, address: e.target.value },
                        }))
                      }
                      className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={quote.client.phone}
                        onChange={(e) =>
                          setQuote((prev) => ({
                            ...prev,
                            client: { ...prev.client, phone: e.target.value },
                          }))
                        }
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="client@company.com"
                        value={quote.client.email}
                        onChange={(e) =>
                          setQuote((prev) => ({
                            ...prev,
                            client: { ...prev.client, email: e.target.value },
                          }))
                        }
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 3: Quote Details */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div
              onClick={() => toggleSection('quoteDetails')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Quote Details</h2>
                  <p className="text-xs text-gray-500">Set quote number and dates</p>
                </div>
              </div>
              {openSections.quoteDetails ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {openSections.quoteDetails && (
              <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Quote Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="QT-001"
                      value={quote.quoteNumber}
                      onChange={(e) => setQuote((prev) => ({ ...prev, quoteNumber: e.target.value }))}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Quote Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={quote.date}
                        onChange={(e) => setQuote((prev) => ({ ...prev, date: e.target.value }))}
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Valid Till <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={quote.validUntil}
                        onChange={(e) => setQuote((prev) => ({ ...prev, validUntil: e.target.value }))}
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      PO Number <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <FileSpreadsheet className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. PO-12345"
                        value={quote.poNumber}
                        onChange={(e) => setQuote((prev) => ({ ...prev, poNumber: e.target.value }))}
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion: Additional Options */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5">
              {/* Top Row: Add Shipping Details Checkbox & Collapse Chevron */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={quote.shipping?.enabled || false}
                    onChange={(e) => handleToggleShipping(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <span>Add Shipping Details</span>
                </label>

                <button
                  type="button"
                  onClick={() => toggleSection('additionalOptions')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {openSections.additionalOptions ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Header Info */}
              <div
                onClick={() => toggleSection('additionalOptions')}
                className="mt-2.5 flex items-center gap-3 cursor-pointer select-none"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Additional Options</h2>
                  <p className="text-xs text-gray-500">Additional settings for shipping, GST and columns</p>
                </div>
              </div>

              {openSections.additionalOptions && (
                <div className="mt-4 space-y-4">
                  {/* Two Action Buttons: Edit GST & Edit Columns/Formulas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTaxModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-gray-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs group"
                    >
                      <span className="text-sm font-black text-purple-600 group-hover:scale-110 transition-transform">
                        %
                      </span>
                      <span>Edit GST</span>
                      {quote.taxConfig && (
                        <span className="text-[10px] font-normal text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full ml-1">
                          {quote.taxConfig.gstType}
                          {quote.taxConfig.hasCess ? ` + ${quote.taxConfig.cessPercent}% Cess` : ''}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowColumnModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-gray-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs group"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                      <span>Edit Columns/Formulas</span>
                      {quote.columns && (
                        <span className="text-[10px] font-normal text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full ml-1">
                          {quote.columns.filter((c) => c.visible).length} visible
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Expandable Shipping Details Section */}
                  {quote.shipping?.enabled && (
                    <div className="pt-4 border-t border-gray-100 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>Shipping &amp; Transport Information</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Shipped From Address
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Dispatch address / warehouse location"
                            value={quote.shipping.shippedFromAddress}
                            onChange={(e) => handleUpdateShipping('shippedFromAddress', e.target.value)}
                            className="w-full text-xs sm:text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Shipped To Name &amp; Address
                          </label>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              placeholder="Recipient / Consignee Name"
                              value={quote.shipping.shippedToName}
                              onChange={(e) => handleUpdateShipping('shippedToName', e.target.value)}
                              className="w-full text-xs sm:text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Destination delivery address"
                              value={quote.shipping.shippedToAddress}
                              onChange={(e) => handleUpdateShipping('shippedToAddress', e.target.value)}
                              className="w-full text-xs sm:text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Mode of Transport
                          </label>
                          <select
                            value={quote.shipping.transportMode}
                            onChange={(e) => handleUpdateShipping('transportMode', e.target.value)}
                            className="w-full text-xs sm:text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Road">Road</option>
                            <option value="Rail">Rail</option>
                            <option value="Air">Air</option>
                            <option value="Sea">Sea</option>
                            <option value="Courier">Courier</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Transporter Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. VRL Logistics, BlueDart"
                            value={quote.shipping.transporterName}
                            onChange={(e) => handleUpdateShipping('transporterName', e.target.value)}
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Vehicle / Tracking No.
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. MH-12-AB-1234 / AWB#88129"
                            value={quote.shipping.vehicleOrTrackingNumber}
                            onChange={(e) => handleUpdateShipping('vehicleOrTrackingNumber', e.target.value)}
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Accordion 4: Items & Summary */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div
              onClick={() => toggleSection('items')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ListFilter className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Items &amp; Summary</h2>
                  <p className="text-xs text-gray-500">Add products or services, and view calculations</p>
                </div>
              </div>
              {openSections.items ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {openSections.items && (
              <div className="p-4 sm:p-5 pt-0 border-t border-gray-100">
                {/* Mobile Item Cards View (No horizontal scrolling on phones) */}
                <div className="block sm:hidden space-y-3">
                  {quote.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50/80 rounded-xl border border-gray-200/90 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Item #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={quote.items.length <= 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Product or service name"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">
                            Unit Price ({quote.currency.symbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={item.unitPrice === 0 ? '' : item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs font-mono px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {isColVisible('col-qty') && (
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 1)
                              }
                              className="w-full text-xs font-mono text-center px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {isColVisible('col-hsn') && (
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">
                              HSN/SAC
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 9983"
                              value={item.hsnSac || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'hsnSac', e.target.value)}
                              className="w-full text-xs font-mono px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {isColVisible('col-gst') && (
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">
                              GST Rate (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="18"
                              value={item.taxPercent ?? 18}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'taxPercent', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-xs font-mono text-center px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {customColumns.map((cc) => (
                          <div key={cc.id} className="col-span-2">
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">
                              {cc.name}
                            </label>
                            <input
                              type={cc.type === 'NUMBER' ? 'number' : 'text'}
                              placeholder={cc.name}
                              value={item[cc.id] ?? ''}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  cc.id as any,
                                  cc.type === 'NUMBER' ? parseFloat(e.target.value) || 0 : e.target.value
                                )
                              }
                              className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                        <span className="text-gray-500 font-medium">Line Amount:</span>
                        <span className="font-bold font-mono text-gray-900 text-sm">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop & Tablet Table Layout */}
                <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-left text-xs min-w-[620px]">
                    <thead className="bg-slate-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Item / Description</th>
                        {isColVisible('col-hsn') && <th className="py-2.5 px-3 w-24 text-left">HSN/SAC</th>}
                        {isColVisible('col-gst') && <th className="py-2.5 px-3 w-20 text-center">GST %</th>}
                        <th className="py-2.5 px-3 w-28 text-right">Unit Price ({quote.currency.symbol})</th>
                        {isColVisible('col-qty') && <th className="py-2.5 px-3 w-20 text-center">Qty</th>}
                        {customColumns.map((cc) => (
                          <th key={cc.id} className="py-2.5 px-3 w-28 text-left">
                            {cc.name}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 w-28 text-right">Amount ({quote.currency.symbol})</th>
                        <th className="py-2.5 px-2 w-10 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quote.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-2.5 text-center font-medium text-gray-400">{index + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="Product or service name"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                              className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          {isColVisible('col-hsn') && (
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="9983"
                                value={item.hsnSac || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'hsnSac', e.target.value)}
                                className="w-full text-xs sm:text-sm px-2.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                              />
                            </td>
                          )}
                          {isColVisible('col-gst') && (
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="18"
                                value={item.taxPercent ?? 18}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, 'taxPercent', parseFloat(e.target.value) || 0)
                                }
                                className="w-full text-xs sm:text-sm px-2 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                              />
                            </td>
                          )}
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0.00"
                              value={item.unitPrice === 0 ? '' : item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-xs sm:text-sm px-3 py-2 text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            />
                          </td>
                          {isColVisible('col-qty') && (
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 1)
                                }
                                className="w-full text-xs sm:text-sm px-2 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                              />
                            </td>
                          )}
                          {customColumns.map((cc) => (
                            <td key={cc.id} className="p-2.5">
                              <input
                                type={cc.type === 'NUMBER' ? 'number' : 'text'}
                                placeholder={cc.name}
                                value={item[cc.id] ?? ''}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.id,
                                    cc.id as any,
                                    cc.type === 'NUMBER' ? parseFloat(e.target.value) || 0 : e.target.value
                                  )
                                }
                                className="w-full text-xs sm:text-sm px-2.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                          <td className="p-2.5 text-right font-semibold text-gray-900 font-mono text-xs sm:text-sm">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={quote.items.length <= 1}
                              className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Item Button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                {/* Calculation Summary Box */}
                <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">
                  <div className="w-full sm:w-84 space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900 font-mono">
                        {formatCurrency(quote.pricing.subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>Discount %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quote.pricing.discountPercent || ''}
                          placeholder="0"
                          onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <span className="font-semibold text-emerald-600 font-mono">
                        - {formatCurrency(quote.pricing.discountAmount)}
                      </span>
                    </div>

                    {/* Tax & GST Breakdown */}
                    {quote.taxConfig?.taxType !== 'None' && (
                      <>
                        {quote.taxConfig?.taxType === 'GST (India)' && quote.taxConfig.gstType === 'CGST & SGST' ? (
                          <>
                            <div className="flex items-center justify-between gap-3 text-gray-600">
                              <div className="flex items-center gap-2">
                                <span>CGST ({Number((quote.pricing.taxPercent / 2).toFixed(1))}%)</span>
                              </div>
                              <span className="font-semibold text-gray-900 font-mono">
                                {formatCurrency(Number((quote.pricing.taxAmount / 2).toFixed(2)))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-gray-600">
                              <div className="flex items-center gap-2">
                                <span>SGST ({Number((quote.pricing.taxPercent / 2).toFixed(1))}%)</span>
                              </div>
                              <span className="font-semibold text-gray-900 font-mono">
                                {formatCurrency(Number((quote.pricing.taxAmount / 2).toFixed(2)))}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between gap-3 text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>
                                {quote.taxConfig?.taxType === 'GST (India)'
                                  ? `IGST (${quote.pricing.taxPercent}%)`
                                  : `Tax (${quote.pricing.taxPercent}%)`}
                              </span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={quote.pricing.taxPercent || ''}
                                placeholder="0"
                                onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0)}
                                className="w-14 px-1.5 py-0.5 text-center text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <span className="font-semibold text-gray-900 font-mono">
                              {formatCurrency(quote.pricing.taxAmount)}
                            </span>
                          </div>
                        )}

                        {quote.taxConfig?.hasCess && (
                          <div className="flex items-center justify-between text-gray-600">
                            <span>Cess ({quote.taxConfig.cessPercent}%)</span>
                            <span className="font-semibold text-gray-900 font-mono">
                              + {formatCurrency(quote.pricing.cessAmount || 0)}
                            </span>
                          </div>
                        )}

                        {quote.taxConfig?.isReverseCharge && (
                          <div className="py-1 px-2.5 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-700 font-medium">
                            Reverse Charge (RCM) Applicable
                          </div>
                        )}
                      </>
                    )}

                    <div className="pt-3 border-t-2 border-gray-900 flex items-center justify-between text-base sm:text-lg font-extrabold text-gray-900">
                      <span>Total</span>
                      <span className="text-blue-950 font-mono">
                        {formatCurrency(quote.pricing.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 5: Notes */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div
              onClick={() => toggleSection('notes')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Notes</h2>
                  <p className="text-xs text-gray-500">Add any additional notes (optional)</p>
                </div>
              </div>
              {openSections.notes ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {openSections.notes && (
              <div className="p-4 sm:p-5 pt-0 border-t border-gray-100">
                <textarea
                  rows={3}
                  placeholder="Add any additional notes, terms or conditions here..."
                  value={quote.notes}
                  onChange={(e) => setQuote((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs sm:text-sm p-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sticky / Bottom Actions */}
        <div className="sticky bottom-4 mt-6 z-20 space-y-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.005] active:scale-[0.995]"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-gray-200/80 shadow-sm text-xs">
            <span className="text-gray-500 font-medium">
              Quote Status: <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Draft</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConvertToInvoice}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-semibold transition-colors"
                title="Convert this quote into an Invoice with 1 click without re-typing"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Convert to Invoice
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Printable Document for High-Res Vector PDF Export */}
        <div
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '794px',
            backgroundColor: '#ffffff',
            zIndex: -9999,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <div
            ref={printableDocRef}
            style={{
              width: '794px',
              boxSizing: 'border-box',
              padding: '28px 34px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              lineHeight: 1.4,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '14px',
                marginBottom: '16px',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  iLove<span style={{ color: '#2563eb' }}>Quote</span>
                </h1>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    padding: '3px 10px',
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {quote.source === 'text'
                    ? '✍️ Processed from Text Prompt AI'
                    : quote.source === 'audio'
                    ? '🎙️ Processed from Voice Speech AI'
                    : 'Official Price Quotation'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '0.5px',
                  }}
                >
                  PRICE QUOTATION
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  <strong>Quote No:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 'bold' }}>
                    {quote.quoteNumber}
                  </span>
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748b' }}>
                  <strong>Date:</strong> {quote.date} | <strong>Valid Till:</strong> {quote.validUntil}
                </p>
              </div>
            </div>

            {/* Address Cards (Flex Row) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b',
                    marginBottom: '4px',
                    fontWeight: 700,
                  }}
                >
                  Quotation Issued By
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '3px',
                  }}
                >
                  {quote.business.name || 'iLoveQuote Technologies'}
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: 1.35 }}>
                  {quote.business.address || 'Plot No. 42, Cyber Gateway, HITEC City, Hyderabad, 500081'}<br />
                  <strong>GSTIN:</strong> 36AAACI1234F1Z8<br />
                  <strong>Email:</strong> {quote.business.email || 'billing@ilovequote.com'}
                </p>
              </div>

              <div
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b',
                    marginBottom: '4px',
                    fontWeight: 700,
                  }}
                >
                  Quotation Prepared For
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '3px',
                  }}
                >
                  {quote.client.name || 'Client / Company Name'}
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: 1.35 }}>
                  {quote.client.address || 'Knowledge Park IV, Commercial Block B, Greater Noida, UP, 201310'}<br />
                  <strong>Attn:</strong> {quote.client.contactPerson || 'Procurement & Operations'}<br />
                  <strong>Phone:</strong> {quote.client.phone || '+91 98765 43210'}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '16px',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '8px 10px',
                      textAlign: 'center',
                      width: '35px',
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '8px 10px',
                      textAlign: 'left',
                    }}
                  >
                    Item Description
                  </th>
                  <th
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '8px 10px',
                      textAlign: 'right',
                      width: '100px',
                    }}
                  >
                    Unit Rate
                  </th>
                  <th
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '8px 10px',
                      textAlign: 'center',
                      width: '50px',
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '8px 10px',
                      textAlign: 'right',
                      width: '115px',
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                    }}
                  >
                    <td
                      style={{
                        padding: '9px 10px',
                        fontSize: '11px',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#64748b',
                        textAlign: 'center',
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        padding: '9px 10px',
                        fontSize: '11px',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#0f172a',
                        fontWeight: 700,
                      }}
                    >
                      {item.name || 'Product / Service Item'}
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>
                        {item.description || 'Standard specification'}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '9px 10px',
                        fontSize: '11px',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#334155',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td
                      style={{
                        padding: '9px 10px',
                        fontSize: '11px',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#334155',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      style={{
                        padding: '9px 10px',
                        fontSize: '11px',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#0f172a',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    >
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section (Flex Row) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '11px',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      color: '#64748b',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      marginBottom: '3px',
                    }}
                  >
                    Total Amount in Words:
                  </strong>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                    {numberToIndianWords(quote.pricing.totalAmount)}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '10px',
                    color: '#64748b',
                  }}
                >
                  <strong style={{ color: '#0f172a' }}>Payment Bank Details:</strong><br />
                  Bank: HDFC Bank Ltd | A/C: 50200084920192 | IFSC: HDFC0001234
                </div>
              </div>

              <div style={{ width: '260px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 6px', color: '#475569' }}>Subtotal:</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>
                        {formatCurrency(quote.pricing.subtotal)}
                      </td>
                    </tr>
                    {quote.pricing.discountAmount > 0 && (
                      <tr style={{ color: '#059669', fontWeight: 600 }}>
                        <td style={{ padding: '4px 6px' }}>Discount ({quote.pricing.discountPercent}%):</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                          - {formatCurrency(quote.pricing.discountAmount)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: '4px 6px', color: '#475569' }}>Taxable Value:</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>
                        {formatCurrency(quote.pricing.subtotal - quote.pricing.discountAmount)}
                      </td>
                    </tr>
                    {quote.pricing.taxAmount > 0 && (
                      <tr>
                        <td style={{ padding: '4px 6px', color: '#475569' }}>GST ({quote.pricing.taxPercent}%):</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>
                          + {formatCurrency(quote.pricing.taxAmount)}
                        </td>
                      </tr>
                    )}
                    <tr
                      style={{
                        borderTop: '2px solid #0f172a',
                        fontWeight: 900,
                        fontSize: '13px',
                      }}
                    >
                      <td style={{ padding: '8px 6px', color: '#0f172a' }}>Grand Total:</td>
                      <td
                        style={{
                          padding: '8px 6px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          color: '#d97706',
                        }}
                      >
                        {formatCurrency(quote.pricing.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms and Signatory (Flex Row) */}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '10px',
                color: '#64748b',
                lineHeight: 1.4,
              }}
            >
              <div style={{ maxWidth: '420px' }}>
                <strong style={{ color: '#334155' }}>Terms &amp; Conditions:</strong><br />
                1. Quotation is valid for {quote.validUntil ? 'the specified validity period' : '15 days'}.<br />
                2. Payment terms: 50% advance along with Purchase Order, balance on completion.<br />
                3. Standard service warranty and OEM terms apply.
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    width: '150px',
                    borderBottom: '1px dashed #94a3b8',
                    marginBottom: '4px',
                    marginLeft: 'auto',
                  }}
                />
                <strong style={{ color: '#0f172a', display: 'block' }}>Authorized Signatory</strong>
                <span style={{ fontSize: '9px', color: '#64748b' }}>
                  {quote.business.name || 'iLoveQuote Technologies'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Modal (Exact Executive Template) */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 no-print">
                <div className="flex items-center gap-2">
                  <BrandMark size="sm" showSubtext={false} />
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                    Official Quotation Document
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isExportingPdf}
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isExportingPdf ? 'Exporting...' : 'Download PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Exact Styled Preview Sheet */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  lineHeight: 1.4,
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                      iLove<span style={{ color: '#2563eb' }}>Quote</span>
                    </h1>
                    <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '14px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
                      {quote.source === 'text' ? '✍️ Processed from Text Prompt AI' : quote.source === 'audio' ? '🎙️ Processed from Voice Speech AI' : 'Official Price Quotation'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      PRICE QUOTATION
                    </h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748b' }}>
                      <strong>Quote No:</strong> <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 'bold' }}>{quote.quoteNumber}</span>
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748b' }}>
                      <strong>Date:</strong> {quote.date} | <strong>Valid Till:</strong> {quote.validUntil}
                    </p>
                  </div>
                </div>

                {/* Address Cards */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '3px', fontWeight: 700 }}>
                      Quotation Issued By
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                      {quote.business.name || 'iLoveQuote Technologies'}
                    </div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#475569', lineHeight: 1.35 }}>
                      {quote.business.address || 'Plot No. 42, Cyber Gateway, HITEC City, Hyderabad, 500081'}<br />
                      <strong>GSTIN:</strong> 36AAACI1234F1Z8<br />
                      <strong>Email:</strong> {quote.business.email || 'billing@ilovequote.com'}
                    </p>
                  </div>

                  <div style={{ flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '3px', fontWeight: 700 }}>
                      Quotation Prepared For
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                      {quote.client.name || 'Client / Company Name'}
                    </div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#475569', lineHeight: 1.35 }}>
                      {quote.client.address || 'Knowledge Park IV, Commercial Block B, Greater Noida, UP, 201310'}<br />
                      <strong>Attn:</strong> {quote.client.contactPerson || 'Procurement & Operations'}<br />
                      <strong>Phone:</strong> {quote.client.phone || '+91 98765 43210'}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '9px', fontWeight: 700, padding: '7px 8px', textAlign: 'center', width: '30px' }}>#</th>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '9px', fontWeight: 700, padding: '7px 8px', textAlign: 'left' }}>Item Description</th>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '9px', fontWeight: 700, padding: '7px 8px', textAlign: 'right', width: '90px' }}>Unit Rate</th>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '9px', fontWeight: 700, padding: '7px 8px', textAlign: 'center', width: '45px' }}>Qty</th>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '9px', fontWeight: 700, padding: '7px 8px', textAlign: 'right', width: '95px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, idx) => (
                      <tr key={item.id} style={{ backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                        <td style={{ padding: '8px', fontSize: '10px', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', fontSize: '10px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>
                          {item.name || 'Product / Service Item'}
                          <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 'normal' }}>{item.description || 'Standard specification'}</div>
                        </td>
                        <td style={{ padding: '8px', fontSize: '10px', borderBottom: '1px solid #e2e8f0', color: '#334155', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ padding: '8px', fontSize: '10px', borderBottom: '1px solid #e2e8f0', color: '#334155', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{item.quantity}</td>
                        <td style={{ padding: '8px', fontSize: '10px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                      Amount in Words:
                    </span>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '10px', color: '#0f172a' }}>
                      {numberToIndianWords(quote.pricing.totalAmount)}
                    </p>
                  </div>

                  <div style={{ width: '230px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                      <span style={{ color: '#64748b' }}>Subtotal:</span>
                      <span style={{ fontFamily: 'monospace' }}>{formatCurrency(quote.pricing.subtotal)}</span>
                    </div>
                    {quote.pricing.discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#059669', marginBottom: '3px' }}>
                        <span>Discount ({quote.pricing.discountPercent}%):</span>
                        <span style={{ fontFamily: 'monospace' }}>- {formatCurrency(quote.pricing.discountAmount)}</span>
                      </div>
                    )}
                    {quote.pricing.taxAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                        <span style={{ color: '#64748b' }}>GST ({quote.pricing.taxPercent}%):</span>
                        <span style={{ fontFamily: 'monospace' }}>+ {formatCurrency(quote.pricing.taxAmount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '12px', paddingTop: '5px', borderTop: '2px solid #0f172a', color: '#0f172a' }}>
                      <span>Grand Total:</span>
                      <span style={{ fontFamily: 'monospace', color: '#d97706' }}>{formatCurrency(quote.pricing.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Signatory */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '9px', color: '#64748b' }}>
                  <div>
                    <strong style={{ color: '#334155' }}>Terms &amp; Conditions:</strong> 50% advance, balance on delivery.
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ width: '120px', borderBottom: '1px dashed #94a3b8', marginBottom: '3px', marginLeft: 'auto' }} />
                    <strong style={{ color: '#0f172a', display: 'block' }}>Authorized Signatory</strong>
                    <span>{quote.business.name || 'iLoveQuote Technologies'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tax Configuration Modal */}
        <TaxConfigModal
          isOpen={showTaxModal}
          onClose={() => setShowTaxModal(false)}
          taxConfig={quote.taxConfig || DEFAULT_TAX_CONFIG}
          onSave={handleSaveTaxConfig}
        />

        {/* Column & Formula Customization Modal */}
        <ColumnFormulaModal
          isOpen={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          columns={quote.columns || DEFAULT_COLUMNS}
          onSave={handleSaveColumns}
        />
      </div>
    </div>
  );
}
