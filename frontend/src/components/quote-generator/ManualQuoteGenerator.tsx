import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import {
  StructuredQuote,
  StructuredQuoteItem,
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  createDefaultStructuredQuote,
  calculateStructuredQuotePricing,
  convertQuoteToInvoiceDraft,
} from '../../types/structuredQuote';
import PhotoQuoteExtractor from './PhotoQuoteExtractor';
import AudioQuoteExtractor from './AudioQuoteExtractor';
import BrandMark from '../BrandMark';
import { isAuthenticated } from '../../auth';

const STORAGE_KEY = 'ilovequote_structured_quote_draft_v1';
const INVOICE_STORAGE_KEY = 'ilovequote_invoice_draft_v1';

export default function ManualQuoteGenerator() {
  const navigate = useNavigate();
  const [quote, setQuote] = useState<StructuredQuote>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return createDefaultStructuredQuote();
  });

  const [activeMode, setActiveMode] = useState<'manual' | 'photo' | 'audio'>('manual');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState<boolean>(false);

  // Accordion open/close states
  const [openSections, setOpenSections] = useState<{
    business: boolean;
    client: boolean;
    quoteDetails: boolean;
    items: boolean;
    notes: boolean;
  }>({
    business: true,
    client: true,
    quoteDetails: true,
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

      const newPricing = calculateStructuredQuotePricing(
        updatedItems,
        prev.pricing.discountPercent,
        prev.pricing.taxPercent
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
      const newPricing = calculateStructuredQuotePricing(
        updatedItems,
        prev.pricing.discountPercent,
        prev.pricing.taxPercent
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
      const newPricing = calculateStructuredQuotePricing(
        updatedItems,
        prev.pricing.discountPercent,
        prev.pricing.taxPercent
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
      const newPricing = calculateStructuredQuotePricing(prev.items, val, prev.pricing.taxPercent);
      return {
        ...prev,
        pricing: newPricing,
      };
    });
  };

  const handleTaxChange = (val: number) => {
    setQuote((prev) => {
      const newPricing = calculateStructuredQuotePricing(prev.items, prev.pricing.discountPercent, val);
      return {
        ...prev,
        pricing: newPricing,
      };
    });
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

  // Handle PDF Export / Print
  const handleDownloadPdf = () => {
    setShowPreviewModal(true);
  };

  // Handle applying extracted data from Photo or Audio
  const handleApplyExtractedData = (data: Partial<StructuredQuote>) => {
    setQuote((prev) => {
      const mergedItems = data.items && data.items.length > 0 ? data.items : prev.items;
      const newPricing = calculateStructuredQuotePricing(
        mergedItems,
        prev.pricing.discountPercent,
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
    setActiveMode('manual');
  };

  const formatCurrency = (amount: number) => {
    return `${quote.currency.symbol}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-6 lg:px-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {/* Mode 1: Create Manually */}
            <div
              onClick={() => setActiveMode('manual')}
              className={`relative rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                activeMode === 'manual'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {activeMode === 'manual' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2.5">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Create Manually</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter items and details</p>
            </div>

            {/* Mode 2: From Photo */}
            <div
              onClick={() => setActiveMode('photo')}
              className={`relative rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                activeMode === 'photo'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {activeMode === 'photo' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">From Photo</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Upload a photo (bill, list, etc.)</p>
            </div>

            {/* Mode 3: From Audio */}
            <div
              onClick={() => setActiveMode('audio')}
              className={`relative rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                activeMode === 'audio'
                  ? 'border-amber-600 bg-amber-50/40 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {activeMode === 'audio' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">From Audio</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Speak and create a quote</p>
            </div>
          </div>

          {/* Quick Preview Quote Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Eye className="w-4 h-4 text-blue-700" />
              Preview Quote
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
                {/* Table Layout */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-slate-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Item / Description</th>
                        <th className="py-2.5 px-3 w-28 text-right">Unit Price ({quote.currency.symbol})</th>
                        <th className="py-2.5 px-3 w-20 text-center">Qty</th>
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
                  <div className="w-full sm:w-80 space-y-3 text-xs sm:text-sm">
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

                    <div className="flex items-center justify-between gap-3 text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>Tax %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quote.pricing.taxPercent || ''}
                          placeholder="0"
                          onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <span className="font-semibold text-gray-900 font-mono">
                        {formatCurrency(quote.pricing.taxAmount)}
                      </span>
                    </div>

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

        {/* Live Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 px-6 border-b border-gray-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-gray-900 text-sm">Quotation Preview ({quote.quoteNumber})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-gray-800">
                {/* Document Header */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                  <div>
                    <h2 className="text-xl font-black text-blue-950 uppercase tracking-tight">
                      {quote.business.name || 'Your Business Name'}
                    </h2>
                    {quote.business.preparedBy && (
                      <p className="text-xs text-gray-500 mt-0.5">Prepared By: {quote.business.preparedBy}</p>
                    )}
                    {quote.business.address && (
                      <p className="text-xs text-gray-500 mt-0.5">{quote.business.address}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[quote.business.phone, quote.business.email, quote.business.website]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-extrabold text-xs tracking-wider">
                      PRICE QUOTE
                    </span>
                    <p className="font-mono font-bold text-gray-900 text-sm mt-1">{quote.quoteNumber}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Date: {quote.date}</p>
                    {quote.validUntil && (
                      <p className="text-gray-500 text-[11px]">Valid Till: {quote.validUntil}</p>
                    )}
                    {quote.poNumber && (
                      <p className="text-gray-500 text-[11px]">PO: {quote.poNumber}</p>
                    )}
                  </div>
                </div>

                {/* Bill To */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Quotation Prepared For
                  </span>
                  <div className="font-bold text-sm text-gray-900">
                    {quote.client.name || 'Client / Company Name'}
                  </div>
                  {quote.client.contactPerson && (
                    <div className="text-xs text-gray-600">Attn: {quote.client.contactPerson}</div>
                  )}
                  {quote.client.address && (
                    <div className="text-xs text-gray-500">{quote.client.address}</div>
                  )}
                  {(quote.client.phone || quote.client.email) && (
                    <div className="text-xs text-gray-500">
                      {[quote.client.phone, quote.client.email].filter(Boolean).join(' | ')}
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-900 text-[11px] font-bold text-gray-900">
                      <th className="py-2 w-8">#</th>
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-center w-14">Qty</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quote.items
                      .filter((item) => item.name || item.unitPrice > 0)
                      .map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-2.5 text-gray-400">{idx + 1}</td>
                          <td className="py-2.5">
                            <span className="font-semibold text-gray-900">{item.name || 'Untitled Item'}</span>
                            {item.description && (
                              <p className="text-[11px] text-gray-500">{item.description}</p>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="py-2.5 text-right font-mono font-semibold">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Pricing Summary */}
                <div className="flex justify-end pt-3 border-t border-gray-200">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCurrency(quote.pricing.subtotal)}</span>
                    </div>
                    {quote.pricing.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount ({quote.pricing.discountPercent}%):</span>
                        <span className="font-mono">- {formatCurrency(quote.pricing.discountAmount)}</span>
                      </div>
                    )}
                    {quote.pricing.taxAmount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax ({quote.pricing.taxPercent}%):</span>
                        <span className="font-mono">{formatCurrency(quote.pricing.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-2 border-t border-gray-900">
                      <span>Grand Total:</span>
                      <span className="font-mono text-blue-900">{formatCurrency(quote.pricing.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes & Terms */}
                {(quote.notes || quote.terms) && (
                  <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-600 space-y-2">
                    {quote.notes && (
                      <div>
                        <span className="font-bold text-gray-800 block">Notes:</span>
                        <p className="whitespace-pre-line">{quote.notes}</p>
                      </div>
                    )}
                    {quote.terms && (
                      <div>
                        <span className="font-bold text-gray-800 block">Terms &amp; Conditions:</span>
                        <p className="whitespace-pre-line">{quote.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
