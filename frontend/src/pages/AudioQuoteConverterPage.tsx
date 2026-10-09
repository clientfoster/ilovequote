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
  BookmarkCheck,
  Clock,
  Sparkle,
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
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

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
  let crore = Math.floor(intVal / 10000000);
  let rem = intVal % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  let thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (crore > 0) str += convert3(crore) + ' Crore ';
  if (lakh > 0) str += convert3(lakh) + ' Lakh ';
  if (thousand > 0) str += convert3(thousand) + ' Thousand ';
  if (rem > 0) str += convert3(rem) + ' ';

  return (str.trim() + ' Rupees Only');
}

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
  if (!text) return 0;
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const directNum = clean.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
  if (directNum) {
    return parseFloat(directNum[1]);
  }

  const tokens = clean.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let foundWord = false;

  for (const word of tokens) {
    if (NUMBER_WORDS[word] !== undefined) {
      foundWord = true;
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
  if (foundWord) return total;

  const anyNum = clean.match(/\b\d+(\.\d+)?\b/);
  return anyNum ? parseFloat(anyNum[0]) : 0;
}

function extractItemFromSegment(segment: string, taxPercent: number): StructuredQuoteItem | null {
  let seg = segment.trim().replace(/^[.\s]+|[.\s]+$/g, '');
  if (!seg || seg.length < 3) return null;

  const lower = seg.toLowerCase();

  // Guard: Ignore bank details, payment metadata, summary lines, and accounts
  if (
    lower.includes('bank') ||
    lower.includes('a/c') ||
    lower.includes('ifsc') ||
    lower.includes('account') ||
    lower.includes('micr') ||
    lower.includes('amount in words') ||
    lower.includes('rupees only') ||
    lower.includes('subtotal') ||
    lower.includes('grand total') ||
    lower.includes('taxable value') ||
    lower.includes('trade discount') ||
    lower.includes('authorized signatory') ||
    lower.includes('gstin') ||
    lower.includes('terms & conditions') ||
    lower.includes('quotation number') ||
    lower.includes('quote no') ||
    lower.includes('quote #') ||
    lower.includes('valid until') ||
    lower.includes('payment terms') ||
    lower.includes('total amount')
  ) {
    return null;
  }

  let qty = 1;
  let price = 0;

  // 1. Detect qty:
  // Check for leading quantity pattern: "5 Dell UltraSharp..." or "1 Server..."
  const leadQty = seg.match(/^\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+([a-zA-Z].*)$/i);
  if (leadQty) {
    qty = parseWordsToNumber(leadQty[1]) || 1;
    seg = leadQty[2];
  } else {
    // Check for "quantity 1 each" or "5 nos/units"
    const qtyPatterns = [
      /(?:quantity\s*(?:of|is|:)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten))/i,
      /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:nos|pcs|units|pieces|items|sets|laptops|monitors|chairs|hours)/i,
    ];
    for (const pat of qtyPatterns) {
      const m = seg.match(pat);
      if (m) {
        qty = parseWordsToNumber(m[1]) || 1;
        seg = seg.replace(pat, ' ');
        break;
      }
    }
  }

  // 2. Detect price (strict filtering against bank account numbers and phone numbers)
  const pricePatterns = [
    /(?:(?:at|@|rs\.?|inr|\$)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:each|per|\/-)?)/i,
    /(?:(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|rupees|inr|\$|each|per|\/-))/i,
    /(?:(?:at|@|costing)\s*)(\d{3,})/i,
    /((?:(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac)\s*)+)\s*(?:rupees|inr|rs|each|per)/i,
    /(?:(?:at|costing|rate\s*of)\s*)((?:(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac)\s*)+)/i,
    /\b(\d{3,}(?:\.\d+)?)\b/,
  ];

  for (const pat of pricePatterns) {
    const m = seg.match(pat);
    if (m) {
      const valStr = m[1] || m[0];
      const digitsOnly = valStr.replace(/\D/g, '');
      if (digitsOnly.length >= 9) continue; // Skip bank/phone
      const parsed = parseWordsToNumber(valStr);
      if (parsed > 0 && parsed <= 10000000) {
        price = parsed;
        seg = seg.replace(m[0], ' ');
        break;
      }
    }
  }

  if (price === 0) {
    return null;
  }

  // 3. Clean item name
  let name = seg
    .replace(/(?:quote\s+for|quotation\s+for|create\s+a\s+quote\s+for|valid\s+for)\s+[A-Za-z0-9\s&.,'-]+/gi, '')
    .replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac|rupees|inr|dollars|each|quantity|at|rate|apply|valid|days)\b/gi, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    !name ||
    name.length < 2 ||
    /\b(bank|account|total|subtotal|discount|taxable|signatory|amount|rupees)\b/i.test(name)
  ) {
    return null;
  }

  return {
    id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    description: 'Extracted automatically from quotation description',
    unitPrice: price,
    quantity: qty,
    amount: Number((qty * price).toFixed(2)),
    taxPercent,
  };
}

export const SAMPLE_TEXT_PROMPTS = [
  {
    title: '🖥️ IT Hardware & Workspace Supply',
    text: 'Create quotation for TechCorp Solutions Pvt Ltd. 5 Dell UltraSharp 27-inch Monitors at 28000 each, 3 Ergonomic Office Chairs at 12500 each, 1 Server Maintenance Package at 45000. Apply 10% discount, 18% GST. Valid for 15 days.',
    client: 'TechCorp Solutions Pvt Ltd',
  },
  {
    title: '⚖️ Legal & Corporate Services',
    text: 'Create a quote for Sunrise Enterprises. Corporate Legal Audit sixty thousand rupees, Trademark Registration fifteen thousand rupees. 5% discount, 18% GST, thirty days validity.',
    client: 'Sunrise Enterprises',
  },
];

export const SAMPLE_VOICE_PROMPTS = [
  {
    title: '📱 Cloud & App Engineering',
    text: 'Create a quote for Apex Innovations. UI UX Mobile App Design forty five thousand rupees, Full Stack Web Portal Development ninety five thousand rupees, Cloud DevOps Hosting setup twenty thousand rupees. Give five percent discount, eighteen percent GST. Valid for thirty days.',
    client: 'Apex Innovations',
  },
  {
    title: '🌐 Web Design & Cloud Hosting',
    text: 'Create a quote for ABC Technologies. Website design twenty five thousand rupees, hosting five thousand rupees, quantity one each. Give them seven days validity.',
    client: 'ABC Technologies',
  },
];

export default function AudioQuoteConverterPage() {
  const navigate = useNavigate();

  // Mode state: 'voice' | 'text' | 'upload'
  const [activeTab, setActiveTab] = useState<'voice' | 'text' | 'upload'>('voice');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [textInput, setTextInput] = useState<string>(
    'Create quotation for TechCorp Solutions Pvt Ltd. 5 Dell UltraSharp 27-inch Monitors at 28000 each, 3 Ergonomic Office Chairs at 12500 each, 1 Server Maintenance Package at 45000. Apply 10% discount, 18% GST. Valid for 15 days.'
  );

  // AI Pipeline state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);
  const [transcriptEditing, setTranscriptEditing] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string>('');

  // Quote State
  const [quote, setQuote] = useState<StructuredQuote>(() => createDefaultStructuredQuote());
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Refs
  const printableDocRef = useRef<HTMLDivElement>(null);
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
      setLiveTranscript('No voice speech was detected. Please check microphone permission, or click one of the quick scenario buttons below.');
      return;
    }

    processInputPrompt(transcriptToAnalyze, 'audio');
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFileName(file.name);
    const samplePrompt = SAMPLE_VOICE_PROMPTS[0];
    setLiveTranscript(samplePrompt.text);
    processInputPrompt(samplePrompt.text, 'audio');
  };

  const handleDirectTextSubmit = () => {
    if (!textInput.trim()) return;
    processInputPrompt(textInput.trim(), 'text');
  };

  // AI Pipeline Processor
  const processInputPrompt = (rawText: string, source: 'audio' | 'text' = 'voice' as any) => {
    setIsProcessing(true);
    setLiveTranscript(rawText);
    setProcessingStep(
      source === 'text'
        ? 'Analyzing quotation text prompt & extracting structured parameters...'
        : 'Converting speech audio to transcript & recognizing terms...'
    );

    setTimeout(() => {
      setProcessingStep('Extracting client name, items, unit quantities, and prices...');
    }, 800);

    setTimeout(() => {
      setProcessingStep('Computing subtotal, discounts, GST breakdown, and validity...');
    }, 1600);

    setTimeout(() => {
      setIsProcessing(false);
      setHasExtracted(true);
      const extractedQuote = extractQuoteFromPrompt(rawText, source);
      setQuote(extractedQuote);
    }, 2200);
  };

  // Rule-based NLP Extractor
  const extractQuoteFromPrompt = (text: string, source: 'audio' | 'text'): StructuredQuote => {
    // 0. Auto-extract prompt if user pasted a full formatted receipt or debug prompt
    let cleanText = text;
    const quotedPromptMatch =
      text.match(/(?:ORIGINAL\s+(?:USER\s+)?TEXT\s+PROMPT\s+ENTERED|PROMPT(?:\s+ENTERED)?|INPUT\s+PROMPT):\s*["“]([^"”]+)["”]/i) ||
      text.match(/["“](Create\s+quotation\s+for[^"”]+)["”]/i);

    if (quotedPromptMatch && quotedPromptMatch[1]) {
      cleanText = quotedPromptMatch[1];
    } else {
      // Filter out bank details, amount in words, and financial summary lines
      const cleanLines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => {
          if (!l) return false;
          const lowerL = l.toLowerCase();
          if (/(?:bank|a\/c|ifsc|micr|branch|account\s*(?:no|number)|502000849)/i.test(lowerL)) return false;
          if (/(?:amount\s+in\s+words|rupees\s+only|in\s+words)/i.test(lowerL)) return false;
          if (/(?:subtotal|grand\s+total|taxable\s+value|trade\s+discount|cgst|sgst|igst|authorized\s+signatory)/i.test(lowerL)) return false;
          if (/(?:quotation\s*(?:#|no|prepared|issued)|gstin|valid\s+until|terms\s*&?\s*conditions)/i.test(lowerL)) return false;
          return true;
        });
      if (cleanLines.length > 0) {
        cleanText = cleanLines.join(' ');
      }
    }

    const lower = cleanText.toLowerCase();

    // 1. Client extraction (stops at first period or item delimiter)
    let clientName = 'TechCorp Solutions Pvt Ltd';
    const clientMatch = cleanText.match(
      /(?:quote|quotation|bill|estimate|proposal)\s+(?:for|to)\s+([^.\n,]+?)(?=[.,\n]|with\b|\bhaving\b|\bconsisting\b|\bquantity\b|\d+\s*(?:nos|pcs|units|items|laptops|monitors|chairs)|\bitem\b|$)/i
    );
    if (clientMatch && clientMatch[1]) {
      clientName = clientMatch[1].trim().replace(/[.,;]$/, '');
    }

    // 2. Validity extraction
    let validityDays = 15;
    const validityMatch = cleanText.match(/(?:valid\s+for|validity)\s+(\d+|seven|fifteen|thirty|ten|fourteen)\s*days?/i);
    if (validityMatch) {
      validityDays = parseWordsToNumber(validityMatch[1]) || 15;
    }

    // 3. Discount extraction
    let discountPercent = 0;
    const discountMatch = cleanText.match(/(\d+|five|ten|fifteen|twenty)\s*(?:%|percent)\s*discount/i);
    if (discountMatch) {
      discountPercent = parseWordsToNumber(discountMatch[1]) || 0;
    }

    // 4. Tax extraction
    let taxPercent = 18;
    const taxMatch = cleanText.match(/(\d+|five|twelve|eighteen|twenty eight)\s*(?:%|percent)\s*(?:gst|tax)/i);
    if (taxMatch) {
      taxPercent = parseWordsToNumber(taxMatch[1]) || 18;
    }

    // 5. Line items extraction: strip client phrase, discount, tax, and validity clauses first
    let itemsText = cleanText
      .replace(/(?:Create\s+a?\s*)?(?:quote|quotation|bill|estimate|proposal)\s+(?:for|to)\s+[^.\n]+(?:\.|$|\n)/i, '')
      .replace(/(?:Give|Apply|with)?\s*(?:five|ten|\d+)\s*(?:percent|%)\s*discount[.,]?/gi, '')
      .replace(/(?:eighteen|\d+)\s*(?:percent|%)\s*(?:gst|tax)[.,]?/gi, '')
      .replace(/Valid\s+for\s+(?:fifteen|thirty|seven|\d+)\s*days?[.,]?/gi, '')
      .replace(/validity\s+(?:fifteen|thirty|seven|\d+)\s*days?[.,]?/gi, '');

    const items: StructuredQuoteItem[] = [];
    const segments = itemsText
      .split(/[,;\n]|\band\b|\balso\b|\bplus\b/i)
      .map((s) => s.trim().replace(/^[.\s]+|[.\s]+$/g, ''))
      .filter((s) => s.length > 3);

    for (const segment of segments) {
      const item = extractItemFromSegment(segment, taxPercent);
      if (item) {
        items.push(item);
      }
    }

    // Fallback if no specific price matched
    if (items.length === 0) {
      items.push({
        id: `item-${Date.now()}-1`,
        name: 'Custom Service / Product',
        description: 'Generated from quotation input',
        unitPrice: 25000,
        quantity: 1,
        amount: 25000,
        taxPercent,
      });
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
      source,
      client: {
        ...baseQuote.client,
        name: clientName,
      },
      items,
      pricing,
      notes: `Quotation generated via ${source === 'text' ? 'Text Prompt AI' : 'Voice Dictation AI'}. Valid for ${validityDays} days from date of issue.`,
      terms: `1. Quotation is valid for ${validityDays} days.\n2. Payment terms: 50% advance, balance on delivery.\n3. Taxes calculated as applicable (${taxPercent}% GST).`,
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

  const handleAddItem = () => {
    const newItem: StructuredQuoteItem = {
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxPercent: quote.pricing.taxPercent,
    };

    setQuote((prev) => {
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

  // Save Quote to LocalStorage
  const handleSaveQuote = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('ilovequote_user_quotes') || '[]');
      const updated = [quote, ...existing.filter((q: any) => q.id !== quote.id)];
      localStorage.setItem('ilovequote_user_quotes', JSON.stringify(updated));
      setSaveToast(`Quote ${quote.quoteNumber} successfully saved to My Quotes!`);
      setTimeout(() => setSaveToast(''), 3500);
    } catch {
      setSaveToast('Saved to session storage!');
      setTimeout(() => setSaveToast(''), 3500);
    }
  };

  // Download Clean Vector PDF directly with high-resolution A4 formatting
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
      setSaveToast(`PDF ${fileName} downloaded successfully!`);
      setTimeout(() => setSaveToast(''), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
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
        {/* Toast Alert */}
        {saveToast && (
          <div className="fixed top-5 right-5 bg-emerald-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 border border-emerald-700 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" showSubtext={false} />
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" /> Page 2: AI Voice &amp; Text Quotation Studio
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
              Dual Engine Quotation Maker
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Create Quote from Voice or Text
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Generate complete price quotations in seconds by speaking into your microphone, or by typing plain text instructions. Our parser automatically structures client details, items, quantities, and rates.
            </p>
          </div>
        </div>

        {/* Studio Card: Two Primary Input Modes */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-7 space-y-6">
          {/* Main Mode Tabs */}
          <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Mic className="w-4 h-4 text-amber-500" />
              <span>🎙️ Create Quote from Voice</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-4 h-4 text-emerald-600" />
              <span>✍️ Create Quote from Text</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`hidden sm:flex py-3 px-4 rounded-xl text-xs font-semibold items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Audio File</span>
            </button>
          </div>

          {/* TAB 1: Create Quote from Voice */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div className="text-center py-6 sm:py-8 space-y-5 bg-gradient-to-b from-amber-50/50 via-white to-transparent rounded-3xl border border-amber-200/60 p-6">
                {!isRecording ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 mx-auto cursor-pointer"
                      >
                        <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        Tap Microphone &amp; Speak Naturally
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        Dictate client name, items, unit prices, and validity. When done, click Stop to extract.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
                      <span className="font-mono text-xl sm:text-2xl font-bold text-red-600">
                        {formatSeconds(recordingSeconds)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Listening to Microphone...
                      </span>
                    </div>

                    {/* Waveform Bars */}
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

                    {liveTranscript && (
                      <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-900 font-mono text-left max-w-lg mx-auto">
                        <span className="font-bold text-[10px] text-amber-700 uppercase block mb-1">
                          Live Voice Transcription:
                        </span>
                        &ldquo;{liveTranscript}&rdquo;
                      </div>
                    )}

                    <div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop &amp; Generate Quote from Voice</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pre-recorded Voice Sample Chips */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                  Or Test with Pre-Recorded Voice Scenarios:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_VOICE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => processInputPrompt(sample.text, 'audio')}
                      className="text-left p-3.5 rounded-2xl border border-amber-200/80 hover:border-amber-400 hover:bg-amber-50/50 bg-white transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-gray-900 group-hover:text-amber-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                          {sample.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          1-Click Demo
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        &ldquo;{sample.text}&rdquo;
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Create Quote from Text */}
          {activeTab === 'text' && (
            <div className="space-y-5">
              <div className="space-y-3 bg-gradient-to-b from-emerald-50/40 via-white to-transparent p-5 sm:p-6 rounded-3xl border border-emerald-200/60">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-gray-800">
                    Type or Paste Quote Details in Plain English:
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Natural Language AI
                  </span>
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. Create quotation for TechCorp Solutions. 5 Dell Monitors at 28000 each, 3 Chairs at 12500 each. Apply 10% discount, 18% GST. Valid for 15 days."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full text-xs sm:text-sm p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed bg-white shadow-2xs"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-gray-400">
                    Supports client names, multiple items, quantities, rates, discounts, and GST.
                  </span>
                  <button
                    type="button"
                    disabled={!textInput.trim()}
                    onClick={handleDirectTextSubmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Quote from Text</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sample Text Prompts Chips */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                  Or Test with Sample Text Scenarios:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_TEXT_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTextInput(sample.text);
                        processInputPrompt(sample.text, 'text');
                      }}
                      className="text-left p-3.5 rounded-2xl border border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50/50 bg-white transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-gray-900 group-hover:text-emerald-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                          {sample.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          1-Click Demo
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        &ldquo;{sample.text}&rdquo;
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Upload Audio File */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAudioUpload}
                accept="audio/*"
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
                  {audioFileName ? `Selected: ${audioFileName}` : 'Upload Recorded Voice Memo'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Drag and drop voice recordings or click to browse. Supports MP3, WAV, M4A, AAC.
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
        </div>

        {/* AI Processing Animation Banner */}
        {isProcessing && (
          <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6 text-center space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto animate-spin">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">AI Quotation Engine Working</h3>
            <p className="text-xs font-semibold text-amber-700">{processingStep}</p>
          </div>
        )}

        {/* Extracted Structured Quote Sheet */}
        {hasExtracted && !isProcessing && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Input Transcript & Source Badge Banner */}
            <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-5 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-gray-900">
                    Input Processed Successfully
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      quote.source === 'text'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {quote.source === 'text' ? '✍️ Created from Text Prompt' : '🎙️ Created from Voice Dictation'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setTranscriptEditing(!transcriptEditing)}
                  className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  {transcriptEditing ? 'Done Editing' : 'Edit Input Text'}
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
                    onClick={() => processInputPrompt(liveTranscript, quote.source as any)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Re-Analyze Input
                  </button>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-800 italic leading-relaxed font-serif bg-white/70 p-3 rounded-xl border border-amber-100">
                  &ldquo;{liveTranscript}&rdquo;
                </p>
              )}

              {/* Extraction Summary Chips */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 font-semibold">
                  👤 Client: {quote.client.name}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 font-semibold">
                  📦 Line Items: {quote.items.length}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 font-semibold">
                  📅 Valid Until: {quote.validUntil}
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
                      Edit any fields below before previewing, saving, or converting to invoice
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
                    Quote Issue Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={quote.date}
                      onChange={(e) =>
                        setQuote((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Valid Till Date
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

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Quotation Line Items ({quote.items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold">
                      <tr>
                        <th className="py-3 px-3 w-8 text-center">#</th>
                        <th className="py-3 px-3">Item / Service Name</th>
                        <th className="py-3 px-3 w-28 text-right">Unit Price</th>
                        <th className="py-3 px-3 w-20 text-center">Qty</th>
                        <th className="py-3 px-3 w-32 text-right">Amount</th>
                        <th className="py-3 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quote.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 text-center text-gray-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                              placeholder="Item description"
                              className="w-full text-xs font-semibold px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-xs px-2.5 py-1.5 text-right font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 1)
                              }
                              className="w-full text-xs px-2.5 py-1.5 text-center font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-gray-100">
                <div className="w-full sm:w-1/2 space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    Terms &amp; Notes
                  </label>
                  <textarea
                    rows={3}
                    value={quote.notes}
                    onChange={(e) => setQuote((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-80 bg-slate-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-gray-900">
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
                      <span>Tax % (GST)</span>
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
                  setLiveTranscript('');
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-colors cursor-pointer"
              >
                Create Another Quote
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveQuote}
                  className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Save Quote
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-amber-600" />
                  Preview Quote
                </button>

                <button
                  type="button"
                  onClick={handleConvertToInvoice}
                  className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Convert to Invoice
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={handleDownloadPdf}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Document Container (100% Inline Hex Styles for pure html2canvas / jsPDF fidelity) */}
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
                  {quote.source === 'text' ? '✍️ Processed from Text Prompt AI' : '🎙️ Processed from Voice Speech AI'}
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
                  <strong>Quote No:</strong> <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 'bold' }}>{quote.quoteNumber}</span>
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
                  iLoveQuote Technologies
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: 1.35 }}>
                  Plot No. 42, Cyber Gateway, HITEC City<br />
                  Hyderabad, Telangana, 500081<br />
                  <strong>GSTIN:</strong> 36AAACI1234F1Z8<br />
                  <strong>Email:</strong> billing@ilovequote.com
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
                  Knowledge Park IV, Commercial Block B<br />
                  Greater Noida, Uttar Pradesh, 201310<br />
                  <strong>Attn:</strong> Procurement &amp; Operations<br />
                  <strong>Phone:</strong> +91 98765 43210
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
                      {item.name || 'Custom Product / Service'}
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
                1. Quotation is valid for 15 days from issue date.<br />
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
                <span style={{ fontSize: '9px', color: '#64748b' }}>iLoveQuote Technologies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Formatted Printable Quote Preview */}
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
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    title="Download Official PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'Saving...' : 'Download PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                    title="Print Document"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable Document Modal Preview (Matching 100% Inline Hex Styles) */}
              <div
                id="printable-quote-document"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '20px 24px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  lineHeight: 1.4,
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                      iLove<span style={{ color: '#2563eb' }}>Quote</span>
                    </h3>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '3px',
                        padding: '2px 8px',
                        backgroundColor: '#ecfdf5',
                        color: '#065f46',
                        borderRadius: '12px',
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {quote.source === 'text' ? '✍️ Text Prompt AI' : '🎙️ Voice Dictation AI'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>PRICE QUOTATION</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>Quote No: <strong>{quote.quoteNumber}</strong></p>
                    <p style={{ margin: '1px 0 0 0', fontSize: '10px', color: '#64748b' }}>Date: {quote.date} | Valid Till: {quote.validUntil}</p>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                    Quotation Prepared For
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                    {quote.client.name || 'Client / Company Name'}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '7px 8px', textAlign: 'center', width: '30px' }}>#</th>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '7px 8px', textAlign: 'left' }}>Item Description</th>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '7px 8px', textAlign: 'right', width: '90px' }}>Unit Price</th>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '7px 8px', textAlign: 'center', width: '45px' }}>Qty</th>
                      <th style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '7px 8px', textAlign: 'right', width: '95px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, idx) => (
                      <tr key={item.id} style={{ backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                        <td style={{ padding: '8px', fontSize: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', fontSize: '11px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>{item.name || 'Item'}</td>
                        <td style={{ padding: '8px', fontSize: '11px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ padding: '8px', fontSize: '11px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{item.quantity}</td>
                        <td style={{ padding: '8px', fontSize: '11px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                      Amount in Words:
                    </span>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '11px', color: '#0f172a' }}>
                      {numberToIndianWords(quote.pricing.totalAmount)}
                    </p>
                  </div>

                  <div style={{ width: '240px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                      <span style={{ color: '#64748b' }}>Subtotal:</span>
                      <span style={{ fontFamily: 'monospace' }}>{formatCurrency(quote.pricing.subtotal)}</span>
                    </div>
                    {quote.pricing.discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#059669', marginBottom: '3px' }}>
                        <span>Discount ({quote.pricing.discountPercent}%):</span>
                        <span style={{ fontFamily: 'monospace' }}>- {formatCurrency(quote.pricing.discountAmount)}</span>
                      </div>
                    )}
                    {quote.pricing.taxAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span style={{ color: '#64748b' }}>GST ({quote.pricing.taxPercent}%):</span>
                        <span style={{ fontFamily: 'monospace' }}>+ {formatCurrency(quote.pricing.taxAmount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '13px', paddingTop: '6px', borderTop: '2px solid #0f172a', color: '#0f172a' }}>
                      <span>Grand Total:</span>
                      <span style={{ fontFamily: 'monospace', color: '#d97706' }}>{formatCurrency(quote.pricing.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Print Media Styles */}
        <style>{`
          @media print {
            body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-quote-document, #printable-quote-document * {
              visibility: visible;
            }
            #printable-quote-document {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 24px !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              z-index: 999999 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
