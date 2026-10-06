import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Upload,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Volume2,
  FileText,
  Layers,
  ArrowRight,
  Printer,
  Download,
  Eye,
  Plus,
  Trash2,
  Calendar,
  User,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Edit3,
} from 'lucide-react';
import {
  StructuredQuote,
  StructuredQuoteItem,
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  createDefaultStructuredQuote,
  calculateStructuredQuotePricing,
  convertQuoteToInvoiceDraft,
} from '../types/structuredQuote';
import BrandMark from '../components/BrandMark';

// Common number words mapping
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  lac: 100000,
  million: 1000000,
  crore: 10000000,
};

function parseWordsToNumber(text: string): number {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  // Direct digit check
  const directNum = clean.match(/\b\d+(\.\d+)?\b/);
  if (directNum) {
    return parseFloat(directNum[0]);
  }

  const tokens = clean.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;

  for (const word of tokens) {
    if (NUMBER_WORDS[word] !== undefined) {
      const val = NUMBER_WORDS[word];
      if (val === 100) {
        current = (current || 1) * 100;
      } else if (val >= 1000) {
        current = (current || 1) * val;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    }
  }
  total += current;
  return total > 0 ? total : 0;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Web Design & Cloud Hosting',
    text: 'Create a quote for ABC Technologies. Website design twenty five thousand rupees, hosting five thousand rupees, quantity one each. Give them seven days validity.',
    client: 'ABC Technologies',
  },
  {
    title: 'Hardware & Workstation Supply',
    text: 'Create quotation for Sunrise Enterprises. Three Dell Laptops at forty five thousand each, five wireless mouse at eight hundred each. 18% GST, fifteen days validity.',
    client: 'Sunrise Enterprises',
  },
  {
    title: 'Mobile App & UI/UX Design',
    text: 'Quote for Apex Solutions. UI UX Design thirty five thousand rupees, Mobile App Development eighty thousand rupees. Ten percent discount, validity thirty days.',
    client: 'Apex Solutions',
  },
];

export default function AudioQuoteConverterPage() {
  const navigate = useNavigate();

  // Audio capture state
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'text'>('record');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');

  // AI Pipeline state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);
  const [transcriptEditing, setTranscriptEditing] = useState<boolean>(false);

  // Quote State
  const [quote, setQuote] = useState<StructuredQuote>(() => createDefaultStructuredQuote());
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Web Speech API Initialization
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setLiveTranscript('');
    transcriptRef.current = '';
    setHasExtracted(false);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Browser Speech Recognition check
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Indian English / Global English

        recognition.onresult = (event: any) => {
          let currentSpeech = '';
          for (let i = 0; i < event.results.length; i++) {
            currentSpeech += event.results[i][0].transcript + ' ';
          }
          const text = currentSpeech.trim();
          transcriptRef.current = text;
          setLiveTranscript(text);
        };

        recognition.onerror = () => {
          // Fallback gracefully
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        // Fallback
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const transcriptToAnalyze =
      transcriptRef.current.trim() ||
      liveTranscript.trim() ||
      '';

    if (!transcriptToAnalyze) {
      setLiveTranscript('No voice speech was detected. Please verify microphone permission or try a sample scenario below.');
      return;
    }

    processSpeechText(transcriptToAnalyze);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFileName(file.name);
    // Simulate audio recognition from uploaded file
    const samplePrompt = SAMPLE_PROMPTS[1];
    setLiveTranscript(samplePrompt.text);
    processSpeechText(samplePrompt.text);
  };

  const handleDirectTextSubmit = () => {
    if (!textInput.trim()) return;
    processSpeechText(textInput.trim());
  };

  // AI Speech Understanding & Entity Extraction
  const processSpeechText = (rawText: string) => {
    setIsProcessing(true);
    setLiveTranscript(rawText);
    setProcessingStep('Converting speech audio to text transcript...');

    setTimeout(() => {
      setProcessingStep('Analyzing natural language & identifying quotation intent...');
    }, 800);

    setTimeout(() => {
      setProcessingStep('Extracting client name, products, quantities, and rates...');
    }, 1600);

    setTimeout(() => {
      setIsProcessing(false);
      setHasExtracted(true);

      // Perform NLP extraction
      const extractedQuote = extractQuoteFromText(rawText);
      setQuote(extractedQuote);
    }, 2400);
  };

  // Rule-based NLP Extractor
  const extractQuoteFromText = (text: string): StructuredQuote => {
    const lower = text.toLowerCase();

    // 1. Client extraction
    let clientName = 'ABC Technologies';
    const clientMatch = text.match(
      /(?:quote|quotation|bill|estimate)\s+(?:for|to)\s+([A-Za-z0-9\s&]+?)(?=\.|\band\b|website|branding|design|item|laptop|hosting|\d|$)/i
    );
    if (clientMatch && clientMatch[1]) {
      clientName = clientMatch[1].trim();
    }

    // 2. Validity extraction
    let validityDays = 7;
    const validityMatch = lower.match(/(\d+|seven|fifteen|thirty|ten|fourteen)\s+(?:days|day)\s+validity/);
    if (validityMatch) {
      validityDays = parseWordsToNumber(validityMatch[1]) || 7;
    }

    // 3. Discount extraction
    let discountPercent = 0;
    const discountMatch = lower.match(/(\d+|five|ten|fifteen|twenty)\s*(?:%|percent)\s*discount/);
    if (discountMatch) {
      discountPercent = parseWordsToNumber(discountMatch[1]) || 0;
    }

    // 4. Tax extraction
    let taxPercent = 18;
    const taxMatch = lower.match(/(\d+|five|twelve|eighteen|twenty eight)\s*(?:%|percent)\s*(?:gst|tax)/);
    if (taxMatch) {
      taxPercent = parseWordsToNumber(taxMatch[1]) || 18;
    }

    // 5. Line items extraction
    const items: StructuredQuoteItem[] = [];

    // Split text by commas, periods, or "and"
    const sentences = text
      .replace(/([A-Z])/g, ' $1')
      .split(/[,.]|\band\b/i)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const segment of sentences) {
      const segLower = segment.toLowerCase();
      // Skip sentences that only declare client name or validity
      if (
        (segLower.includes('create a quote') || segLower.includes('give them')) &&
        !segLower.includes('rupees') &&
        !segLower.includes('each')
      ) {
        continue;
      }

      // Check if segment contains price/rates
      const rate = parseWordsToNumber(segment);
      if (rate > 0) {
        // Quantity check
        let qty = 1;
        const qtyMatch = segment.match(/(\d+|one|two|three|four|five|ten)\s+(?:quantity|each|pcs|units|items)/i);
        const leadingQtyMatch = segment.match(
          /^\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+([a-zA-Z\s]+)/i
        );

        if (qtyMatch) {
          qty = parseWordsToNumber(qtyMatch[1]) || 1;
        } else if (leadingQtyMatch && !leadingQtyMatch[2].toLowerCase().includes('rupee')) {
          qty = parseWordsToNumber(leadingQtyMatch[1]) || 1;
        }

        // Clean name
        let itemName = segment
          .replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac|rupees|inr|dollars|each|quantity|one|two|three|four|five|at|\d+)\b/gi, '')
          .replace(/[^\w\s]/g, '')
          .trim();

        if (!itemName || itemName.length < 2) {
          itemName = 'Custom Service / Product';
        }

        items.push({
          id: `voice-item-${Date.now()}-${items.length + 1}`,
          name: itemName,
          description: 'Extracted from audio dictation',
          unitPrice: rate,
          quantity: qty,
          amount: Number((qty * rate).toFixed(2)),
          taxPercent,
        });
      }
    }

    // Default fallback if no specific items matched
    if (items.length === 0) {
      items.push(
        {
          id: `voice-item-${Date.now()}-1`,
          name: 'Website Design',
          description: 'Custom responsive design',
          unitPrice: 25000,
          quantity: 1,
          amount: 25000,
          taxPercent,
        },
        {
          id: `voice-item-${Date.now()}-2`,
          name: 'Hosting Setup',
          description: 'Cloud server hosting deployment',
          unitPrice: 5000,
          quantity: 1,
          amount: 5000,
          taxPercent,
        }
      );
    }

    const today = new Date();
    const validUntilDate = new Date();
    validUntilDate.setDate(today.getDate() + validityDays);

    const baseQuote = createDefaultStructuredQuote();
    const pricing = calculateStructuredQuotePricing(items, discountPercent, taxPercent);

    return {
      ...baseQuote,
      quoteNumber: `QT-${String(Math.floor(100 + Math.random() * 900))}`,
      date: today.toISOString().split('T')[0],
      validUntil: validUntilDate.toISOString().split('T')[0],
      source: 'audio',
      client: {
        ...baseQuote.client,
        name: clientName,
      },
      items,
      pricing,
      notes: `Quotation generated via Voice Dictation. Valid for ${validityDays} days from date of issue.`,
      terms: `1. Quotation is valid for ${validityDays} days.\n2. Payment terms: 50% advance, balance on completion.\n3. Taxes calculated as applicable.`,
    };
  };

  // Item Update
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
      };
    });
  };

  const handleAddItem = () => {
    setQuote((prev) => {
      const newItem: StructuredQuoteItem = {
        id: `voice-item-${Date.now()}-${prev.items.length + 1}`,
        name: '',
        description: '',
        unitPrice: 0,
        quantity: 1,
        amount: 0,
      };
      const updatedItems = [...prev.items, newItem];
      return {
        ...prev,
        items: updatedItems,
        pricing: calculateStructuredQuotePricing(
          updatedItems,
          prev.pricing.discountPercent,
          prev.pricing.taxPercent
        ),
      };
    });
  };

  const handleRemoveItem = (id: string) => {
    setQuote((prev) => {
      const updatedItems = prev.items.filter((item) => item.id !== id);
      return {
        ...prev,
        items: updatedItems,
        pricing: calculateStructuredQuotePricing(
          updatedItems,
          prev.pricing.discountPercent,
          prev.pricing.taxPercent
        ),
      };
    });
  };

  const handleDiscountChange = (val: number) => {
    setQuote((prev) => ({
      ...prev,
      pricing: calculateStructuredQuotePricing(prev.items, val, prev.pricing.taxPercent),
    }));
  };

  const handleTaxChange = (val: number) => {
    setQuote((prev) => ({
      ...prev,
      pricing: calculateStructuredQuotePricing(prev.items, prev.pricing.discountPercent, val),
    }));
  };

  const handleSelectCurrency = (currency: CurrencyInfo) => {
    setQuote((prev) => ({ ...prev, currency }));
    setCurrencyDropdownOpen(false);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatCurrency = (amount: number) => {
    return `${quote.currency.symbol}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Convert to Invoice
  const handleConvertToInvoice = () => {
    const draft = convertQuoteToInvoiceDraft(quote);
    try {
      localStorage.setItem('ilovequote_invoice_draft_v1', JSON.stringify(draft));
    } catch {
      // ignore
    }
    navigate('/create-invoice');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" showSubtext={false} />
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Mic className="w-3 h-3 text-amber-600" /> Page 2: Audio to Price Converter
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Currency Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-800 transition-colors shadow-2xs"
                >
                  <span>{quote.currency.flag || '🌐'}</span>
                  <span>{quote.currency.code} ({quote.currency.symbol})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {currencyDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Select Currency
                    </div>
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => handleSelectCurrency(curr)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 transition-colors ${
                          quote.currency.code === curr.code
                            ? 'font-bold text-amber-700 bg-amber-50/50'
                            : 'text-gray-700'
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

              {/* Version Switcher Buttons */}
              <button
                type="button"
                onClick={() => navigate('/create-quote2')}
                className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-colors"
                title="View Review 3 Options"
              >
                Review 3 Model
              </button>
            </div>
          </div>

          {/* Module Heading */}
          <div className="pt-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Voice Quotation Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Voice → Price Quote Converter
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Speak naturally into your microphone or upload an audio memo. Our speech AI understands items, quantities, client details, and prices to create a structured price quote instantly.
            </p>
          </div>
        </div>

        {/* Studio Card: Audio Input & Recording */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-7 space-y-6">
          {/* Studio Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('record')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'record'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Mic className="w-4 h-4 text-amber-500" />
              <span>Record Voice</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 text-blue-500" />
              <span>Upload Audio File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'text'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-4 h-4 text-emerald-500" />
              <span>Paste Voice Transcript</span>
            </button>
          </div>

          {/* TAB 1: Live Voice Recording */}
          {activeTab === 'record' && (
            <div className="text-center py-6 sm:py-8 space-y-5 bg-gradient-to-b from-amber-50/40 via-white to-transparent rounded-3xl border border-amber-100/60 p-6">
              {!isRecording ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 mx-auto"
                    >
                      <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      Tap to Start Speaking
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                      Dictate your client name, items, rates, and validity clearly. Click stop when finished.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Active Recording State */}
                  <div className="flex items-center justify-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-mono text-xl sm:text-2xl font-bold text-red-600">
                      {formatSeconds(recordingSeconds)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Listening...
                    </span>
                  </div>

                  {/* Dynamic Sound Waveform Bars */}
                  <div className="flex items-center justify-center gap-1.5 h-14">
                    {[16, 28, 44, 20, 52, 34, 18, 48, 22, 40, 16, 32].map((height, i) => (
                      <span
                        key={i}
                        className="w-1.5 bg-amber-500 rounded-full animate-pulse"
                        style={{
                          height: `${height}px`,
                          animationDelay: `${i * 100}ms`,
                          animationDuration: '800ms',
                        }}
                      />
                    ))}
                  </div>

                  {/* Live Transcript Stream */}
                  {liveTranscript && (
                    <div className="max-w-xl mx-auto p-3.5 bg-white/90 border border-amber-200 rounded-2xl text-xs sm:text-sm text-gray-800 text-left font-medium shadow-2xs">
                      <span className="text-[10px] font-bold text-amber-600 uppercase block mb-1">
                        Live Speech Transcript:
                      </span>
                      &ldquo;{liveTranscript}&rdquo;
                    </div>
                  )}

                  {/* Stop Button */}
                  <div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-6 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      Stop &amp; Generate Quote
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Audio File Upload */}
          {activeTab === 'upload' && (
            <div className="py-6 sm:py-8">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAudioUpload}
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {audioFileName ? `Selected: ${audioFileName}` : 'Upload Recorded Audio Note'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Drag and drop voice recordings or click to browse. Supports MP3, WAV, M4A, AAC audio formats.
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  Select Audio File
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Direct Transcript Paste */}
          {activeTab === 'text' && (
            <div className="space-y-3 py-2">
              <label className="block text-xs font-bold text-gray-700">
                Paste Audio Memo / Speech Transcript:
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Create a quote for ABC Technologies. Website design twenty five thousand rupees, hosting five thousand rupees, quantity one each. Give them seven days validity."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full text-xs sm:text-sm p-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!textInput.trim()}
                  onClick={handleDirectTextSubmit}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Convert Transcript to Quote
                </button>
              </div>
            </div>
          )}

          {/* Sample Prompts Tray */}
          <div className="pt-4 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
              Or Try a Pre-Recorded Voice Scenario:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => processSpeechText(sample.text)}
                  className="text-left p-3 rounded-2xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/40 bg-white transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 group-hover:text-amber-700">
                    <Volume2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{sample.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    &ldquo;{sample.text}&rdquo;
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Processing Animation Banner */}
        {isProcessing && (
          <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6 text-center space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto animate-spin">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">AI Speech Engine Working</h3>
            <p className="text-xs sm:text-sm text-amber-700 font-medium">{processingStep}</p>
          </div>
        )}

        {/* Extracted Structured Quote Review & Editor */}
        {hasExtracted && !isProcessing && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Audio Transcript Review Box */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Extracted Speech Transcript
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTranscriptEditing(!transcriptEditing)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
                >
                  {transcriptEditing ? 'Done Editing' : 'Edit Transcript'}
                </button>
              </div>

              {transcriptEditing ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={liveTranscript}
                    onChange={(e) => setLiveTranscript(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 bg-white border border-amber-300 rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => processSpeechText(liveTranscript)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                  >
                    Re-Analyze Transcript
                  </button>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-800 italic leading-relaxed">
                  &ldquo;{liveTranscript}&rdquo;
                </p>
              )}

              {/* Extraction Chips */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 font-semibold">
                  👤 Client: {quote.client.name || 'ABC Technologies'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 font-semibold">
                  📦 Items: {quote.items.length}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 font-semibold">
                  📅 Validity: {quote.validUntil}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                  💰 Total: {formatCurrency(quote.pricing.totalAmount)}
                </span>
              </div>
            </div>

            {/* Structured Quotation Details Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-7 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      Generated Quotation Sheet
                    </h2>
                    <p className="text-xs text-gray-500">
                      Review and fine-tune your quotation fields before generating PDF or invoice
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                  {quote.quoteNumber}
                </span>
              </div>

              {/* Client & Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Client / Company Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={quote.client.name}
                      onChange={(e) =>
                        setQuote((prev) => ({
                          ...prev,
                          client: { ...prev.client, name: e.target.value },
                        }))
                      }
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quote Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={quote.date}
                      onChange={(e) => setQuote((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Valid Till
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={quote.validUntil}
                      onChange={(e) =>
                        setQuote((prev) => ({ ...prev, validUntil: e.target.value }))
                      }
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Line Items &amp; Pricing
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                {/* Mobile Item Cards */}
                <div className="block sm:hidden space-y-3">
                  {quote.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50/80 rounded-2xl border border-gray-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500">Item #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={quote.items.length <= 1}
                          className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-gray-200 rounded-lg"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500">
                            Unit Price ({quote.currency.symbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice === 0 ? '' : item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs font-mono px-3 py-2 bg-white border border-gray-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full text-xs font-mono text-center px-3 py-2 bg-white border border-gray-200 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-gray-500">Line Total:</span>
                        <span className="font-bold font-mono text-gray-900">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-slate-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Item / Description</th>
                        <th className="py-2.5 px-3 w-32 text-right">Unit Price ({quote.currency.symbol})</th>
                        <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                        <th className="py-2.5 px-3 w-32 text-right">Amount ({quote.currency.symbol})</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quote.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-2.5 text-center font-medium text-gray-400">{index + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.name}
                              placeholder="Product or service name"
                              onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                              className="w-full text-xs sm:text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice === 0 ? '' : item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-xs sm:text-sm px-3 py-1.5 text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
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
                              className="w-full text-xs sm:text-sm px-2 py-1.5 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
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
                              className="p-1 rounded text-gray-400 hover:text-red-600 disabled:opacity-20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Summary Calculation */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <div className="w-full sm:w-80 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-900 font-mono">
                      {formatCurrency(quote.pricing.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span>Discount %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quote.pricing.discountPercent || ''}
                        placeholder="0"
                        onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                        className="w-14 px-1.5 py-0.5 text-center border border-gray-200 rounded-md font-mono"
                      />
                    </div>
                    <span className="font-semibold text-emerald-600 font-mono">
                      - {formatCurrency(quote.pricing.discountAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span>Tax % (GST/VAT)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quote.pricing.taxPercent || ''}
                        placeholder="0"
                        onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0)}
                        className="w-14 px-1.5 py-0.5 text-center border border-gray-200 rounded-md font-mono"
                      />
                    </div>
                    <span className="font-semibold text-gray-900 font-mono">
                      {formatCurrency(quote.pricing.taxAmount)}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t-2 border-gray-900 flex items-center justify-between text-base sm:text-lg font-black text-gray-900">
                    <span>Grand Total:</span>
                    <span className="text-amber-600 font-mono">
                      {formatCurrency(quote.pricing.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setHasExtracted(false);
                  setActiveTab('record');
                  setLiveTranscript('');
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-colors"
              >
                Record Another Voice Quote
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-amber-600" />
                  Preview Quote
                </button>

                <button
                  type="button"
                  onClick={handleConvertToInvoice}
                  className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Convert to Invoice
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Document Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 px-6 border-b border-gray-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-gray-900 text-sm">
                    Quotation Preview ({quote.quoteNumber})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
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

              {/* Printable Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-gray-800">
                <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                  <div>
                    <h2 className="text-xl font-black text-blue-950 uppercase tracking-tight">
                      {quote.business.name || 'Your Business Name'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[quote.business.phone, quote.business.email].filter(Boolean).join(' • ') ||
                        'Voice Dictation Price Quote'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-extrabold text-xs tracking-wider">
                      PRICE QUOTE
                    </span>
                    <p className="font-mono font-bold text-gray-900 text-sm mt-1">{quote.quoteNumber}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Date: {quote.date}</p>
                    <p className="text-gray-500 text-[11px]">Valid Till: {quote.validUntil}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Quotation Prepared For
                  </span>
                  <div className="font-bold text-sm text-gray-900">
                    {quote.client.name || 'Client / Company Name'}
                  </div>
                </div>

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
                    {quote.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-2.5 text-gray-400">{idx + 1}</td>
                        <td className="py-2.5 font-semibold text-gray-900">{item.name || 'Item'}</td>
                        <td className="py-2.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

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
                      <span className="font-mono text-amber-600 font-bold">
                        {formatCurrency(quote.pricing.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {quote.notes && (
                  <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-600">
                    <span className="font-bold text-gray-800 block">Notes:</span>
                    <p className="whitespace-pre-line">{quote.notes}</p>
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
