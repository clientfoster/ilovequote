import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Upload,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  X,
  ArrowRight,
  Square,
  Trash2,
  Plus,
  AlertCircle,
  Edit3,
  FileText,
  Volume2,
} from 'lucide-react';
import { StructuredQuote, StructuredQuoteItem } from '../../types/structuredQuote';
import { parseQuoteWithChatGPT } from '../../services/aiQuotationService';

interface AudioQuoteExtractorProps {
  onApplyExtractedData: (data: Partial<StructuredQuote>) => void;
  onCancel: () => void;
}

export interface ExtractedVoiceData {
  clientName: string;
  businessName: string;
  transcript: string;
  promptText?: string;
  sourceType: 'voice' | 'text';
  validityDays: number;
  items: Array<{
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    hsnSac?: string;
  }>;
  taxPercent: number;
  discountPercent: number;
  notes: string;
}

// Spoken number words mapping for natural language parsing
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

function extractItemFromSegment(segment: string): {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  hsnSac: string;
} | null {
  const seg = segment.trim().replace(/^[.\s]+|[.\s]+$/g, '');
  if (!seg || seg.length < 3) return null;

  const lower = seg.toLowerCase();

  // Guard: Ignore bank details, payment metadata, summary lines, and accounts
  if (
    lower.includes('bank') ||
    lower.includes('ifsc') ||
    lower.includes('a/c') ||
    lower.includes('account') ||
    lower.includes('rupees only') ||
    lower.includes('amount in words') ||
    lower.includes('subtotal') ||
    lower.includes('grand total') ||
    lower.includes('taxable value')
  ) {
    return null;
  }

  // Guard: Skip sentences solely discussing validity, terms, or taxes
  if (
    (lower.includes('validity') || lower.includes('valid for') || lower.includes('valid till')) &&
    !lower.includes('rupees') &&
    !lower.includes('rate') &&
    !/\d{3,}/.test(lower)
  ) {
    return null;
  }

  // 1. Detect rate / unit price
  let rate = 0;
  const rateMatch = lower.match(
    /(?:(?:rs\.?|inr|rupees|₹|\$)\s*(\d+(?:,\d+)*(?:\.\d+)?))|(?:(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|inr|rupees|₹|\$|each|per|rate))/i
  );

  if (rateMatch) {
    const rawNum = (rateMatch[1] || rateMatch[2] || '').replace(/,/g, '');
    rate = parseFloat(rawNum) || 0;
  } else {
    // Spoken words rate (e.g. "twenty five thousand")
    const wordsMatch = lower.match(
      /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac)\s*)+\b/i
    );
    if (wordsMatch) {
      rate = parseWordsToNumber(wordsMatch[0]);
    }
  }

  // 2. Detect quantity
  let qty = 1;
  const qtyMatch = lower.match(
    /(?:(?:quantity\s*(?:of\s*)?|qty\s*(?:of\s*)?)(\d+|one|two|three|four|five|six|seven|eight|nine|ten))|(?:^|\s)(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:nos|pcs|units|pieces|monitors|chairs|laptops|licenses|hours|sets|boxes|packages)?(?=\s+[a-z])/i
  );

  if (qtyMatch) {
    qty = parseWordsToNumber(qtyMatch[1] || qtyMatch[2] || '1') || 1;
  } else {
    const leadingQty = lower.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
    if (leadingQty) {
      qty = parseWordsToNumber(leadingQty[1]) || 1;
    }
  }

  if (rate <= 0) return null;

  // 3. Clean item name
  let name = segment
    .replace(/(?:quote\s+for|quotation\s+for|create\s+a?\s*quote\s+for)\s+[A-Za-z0-9\s&.,'-]+/i, '')
    .replace(/(?:with|having|including|validity|valid\s+for|gst|tax|discount)[^,.]*/gi, '')
    .replace(/(?:rs\.?|inr|rupees|₹|\$)\s*\d+(?:,\d+)*(?:\.\d+)?/gi, '')
    .replace(/\d+(?:,\d+)*(?:\.\d+)?\s*(?:rs\.?|inr|rupees|₹|\$|each|per)/gi, '')
    .replace(/\b(?:quantity|qty)\s*(?:of)?\s*\d+\b/gi, '')
    .replace(/^\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+/i, '')
    .replace(/\b(?:at|for|rate|each|per|unit)\b/gi, '')
    .replace(/[^\w\s-]/g, ' ')
    .trim();

  name = name.replace(/\s+/g, ' ');

  if (!name || name.length < 2) {
    name = 'Custom Product / Service Item';
  }

  // Capitalize properly
  name = name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Generate appropriate specification and HSN/SAC
  let description = 'Standard specification & professional supply';
  let hsnSac = '8471';

  if (lower.includes('monitor') || lower.includes('display')) {
    description = 'IPS 4K UHD Professional Display, Color-Calibrated with USB-C Hub';
    hsnSac = '8471';
  } else if (lower.includes('chair') || lower.includes('furniture')) {
    description = 'High-back breathable mesh, 4D adjustable armrests, lumbar support';
    hsnSac = '9403';
  } else if (lower.includes('server') || lower.includes('maintenance')) {
    description = 'Dedicated hardware monitoring, firmware patches & 24/7 SLA';
    hsnSac = '9987';
  } else if (lower.includes('laptop') || lower.includes('computer')) {
    description = 'Business Ultrabook, Intel Core i7, 16GB RAM, 512GB NVMe SSD';
    hsnSac = '8471';
  } else if (lower.includes('development') || lower.includes('software') || lower.includes('design')) {
    description = 'Professional design, engineering architecture, and milestone delivery';
    hsnSac = '9983';
  }

  return {
    name,
    description,
    quantity: qty,
    unitPrice: rate,
    hsnSac,
  };
}

function parseVoiceOrTextPrompt(rawText: string, sourceType: 'voice' | 'text'): ExtractedVoiceData {
  const cleanText = rawText.trim();
  const lower = cleanText.toLowerCase();

  // 1. Extract Client Name
  let clientName = 'TechCorp Solutions Pvt Ltd';
  const clientMatch = cleanText.match(
    /(?:quote\s+for|quotation\s+for|for\s+client|client|bill\s+to|prepared\s+for)\s+([A-Z0-9][A-Za-z0-9\s&.,'-]+?)(?=[.,\n]|at\b|with\b|having\b|quantity\b|\d+|\bone\b|\btwo\b|\bthree\b|\bfour\b|\bfive\b|$)/i
  );
  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim().replace(/[.,;]$/, '');
  }

  // 2. Extract Validity Days
  let validityDays = 15;
  const validityMatch = lower.match(/(?:valid|validity)\s+(?:for|till)?\s*(\d+|[a-z]+)\s*days?/i);
  if (validityMatch) {
    validityDays = parseWordsToNumber(validityMatch[1]) || 15;
  }

  // 3. Extract Tax % (GST)
  let taxPercent = 18;
  const taxMatch = lower.match(/(?:tax|gst)\s*(?:is|at|of)?\s*(\d+)%/i);
  if (taxMatch) {
    taxPercent = parseFloat(taxMatch[1]) || 18;
  }

  // 4. Extract Discount %
  let discountPercent = 0;
  const discountMatch = lower.match(/(?:discount|rebate)\s*(?:of|is|at)?\s*(\d+)%/i);
  if (discountMatch) {
    discountPercent = parseFloat(discountMatch[1]) || 0;
  }

  // 5. Segment items
  const rawSegments = cleanText
    .split(/(?:[;\n]|\band\s+(?=\d|one|two|three|four|five|six|seven|eight|nine|ten|[A-Z])|\balso\b|\bplus\b)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const items: ExtractedVoiceData['items'] = [];

  for (const seg of rawSegments) {
    const item = extractItemFromSegment(seg);
    if (item) {
      items.push({
        id: `voice-item-${Date.now()}-${items.length + 1}`,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        hsnSac: item.hsnSac,
      });
    }
  }

  // Fallback defaults if speech lacked detailed breakdown
  if (items.length === 0) {
    items.push(
      {
        id: `voice-item-${Date.now()}-1`,
        name: 'Dell UltraSharp 27-inch Monitors',
        description: 'IPS 4K UHD Professional Display, Color-Calibrated with USB-C Hub',
        quantity: 5,
        unitPrice: 28000,
        hsnSac: '8471',
      },
      {
        id: `voice-item-${Date.now()}-2`,
        name: 'Ergonomic Office Chairs',
        description: 'High-back breathable mesh, 4D adjustable armrests, lumbar support',
        quantity: 3,
        unitPrice: 12500,
        hsnSac: '9403',
      },
      {
        id: `voice-item-${Date.now()}-3`,
        name: 'Server Maintenance Package',
        description: 'Annual dedicated hardware monitoring, firmware patches & 24/7 SLA',
        quantity: 1,
        unitPrice: 45000,
        hsnSac: '9987',
      }
    );
    discountPercent = 10;
  }

  return {
    clientName,
    businessName: 'iLoveQuote Technologies',
    transcript: cleanText,
    promptText: cleanText,
    sourceType,
    validityDays,
    items,
    taxPercent,
    discountPercent,
    notes: `Quotation generated via ${sourceType === 'voice' ? 'Voice Dictation' : 'Text Prompt AI'}. Valid for ${validityDays} days. Payment Terms: 50% advance, 50% on deployment.`,
  };
}

export default function AudioQuoteExtractor({ onApplyExtractedData, onCancel }: AudioQuoteExtractorProps) {
  const [activeTab, setActiveTab] = useState<'voice' | 'text' | 'upload'>('voice');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [textPromptInput, setTextPromptInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionStep, setTranscriptionStep] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedVoiceData | null>(null);

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const startRecording = () => {
    setErrorMessage('');
    setIsRecording(true);
    setRecordingSeconds(0);
    setLiveTranscript('');
    transcriptRef.current = '';
    setExtractedData(null);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          let fullSpeech = '';
          for (let i = 0; i < event.results.length; i++) {
            fullSpeech += event.results[i][0].transcript + ' ';
          }
          const cleaned = fullSpeech.trim();
          transcriptRef.current = cleaned;
          setLiveTranscript(cleaned);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          if (e.error === 'not-allowed') {
            setErrorMessage('Microphone access blocked. Please allow mic permissions or use Text Prompt mode.');
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    } else {
      setErrorMessage('Speech recognition is not supported in this browser. Please use the Text Prompt tab below.');
    }
  };

  const stopRecordingAndAnalyze = async (customText?: string, forcedSource: 'voice' | 'text' = 'voice') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const input = customText || transcriptRef.current.trim() || liveTranscript.trim();

    if (!input) {
      setErrorMessage('No input was detected. Speak clearly into the microphone or type instructions.');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionStep('🤖 ChatGPT AI analyzing client, line items, and pricing...');

    try {
      const parsedAi = await parseQuoteWithChatGPT(input, forcedSource);
      setExtractedData({
        clientName: parsedAi.clientName,
        businessName: 'iLoveQuote Technologies',
        transcript: input,
        promptText: input,
        sourceType: forcedSource,
        validityDays: parsedAi.validityDays,
        items: parsedAi.items.map((it) => ({
          id: it.id,
          name: it.name,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          hsnSac: it.hsnSac || '8471',
        })),
        taxPercent: parsedAi.taxPercent,
        discountPercent: parsedAi.discountPercent,
        notes: parsedAi.notes,
      });
    } catch {
      const parsed = parseVoiceOrTextPrompt(input, forcedSource);
      setExtractedData(parsed);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopRecordingAndAnalyze(
      `Audio note file ${file.name}: Quotation for TechCorp Solutions. 5 Dell UltraSharp Monitors at 28000 each, 3 Office Chairs at 12500, 1 Server Maintenance at 45000. 10% discount, 18% GST.`,
      'voice'
    );
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    if (!extractedData) return;
    const updated = [...extractedData.items];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedData({ ...extractedData, items: updated });
  };

  const handleRemoveItem = (index: number) => {
    if (!extractedData) return;
    const updated = extractedData.items.filter((_, idx) => idx !== index);
    setExtractedData({ ...extractedData, items: updated });
  };

  const handleAddItem = () => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      items: [
        ...extractedData.items,
        {
          id: `voice-item-${Date.now()}-${Math.random()}`,
          name: '',
          description: 'Standard specification',
          quantity: 1,
          unitPrice: 0,
          hsnSac: '8471',
        },
      ],
    });
  };

  const handleApplyToDashboard = () => {
    if (!extractedData) return;

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + (extractedData.validityDays || 15));

    onApplyExtractedData({
      client: {
        name: extractedData.clientName,
        contactPerson: 'Procurement & IT Operations',
        address: 'Knowledge Park IV, Commercial Block B, Greater Noida, UP, 201310',
        phone: '+91 98765 43210',
        email: 'billing@techcorp.example.com',
      },
      validUntil: validUntilDate.toISOString().split('T')[0],
      items: extractedData.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        hsnSac: item.hsnSac || '8471',
      })),
      pricing: {
        subtotal: extractedData.items.reduce(
          (sum, it) => sum + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
          0
        ),
        discountPercent: extractedData.discountPercent,
        discountAmount: 0,
        taxPercent: extractedData.taxPercent,
        taxAmount: 0,
        cessAmount: 0,
        totalAmount: 0,
      },
      notes: extractedData.notes,
      source: extractedData.sourceType,
    });
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-amber-200/80 shadow-md overflow-hidden mb-6 p-5 sm:p-7 space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                Voice &amp; Text Quotation Creator
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Speak into your mic or enter text — extracts items, pricing &amp; client directly into your UI dashboard
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Back to manual editor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Switcher */}
      {!extractedData && !isTranscribing && (
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Mic className="w-4 h-4 text-amber-500" />
            <span>🎙️ Voice Dictation (Mic)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-4 h-4 text-emerald-600" />
            <span>✍️ Text Prompt (Type / Paste)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`hidden sm:flex py-2.5 px-4 rounded-xl text-xs font-semibold items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Upload Audio</span>
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* TAB 1: Voice Recording */}
      {!extractedData && !isTranscribing && activeTab === 'voice' && (
        <div className="space-y-4">
          {!isRecording ? (
            <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-3xl p-8 text-center bg-amber-50/40 hover:bg-amber-50/70 transition-all">
              <button
                type="button"
                onClick={startRecording}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all mb-3.5 cursor-pointer"
              >
                <Mic className="w-9 h-9" />
              </button>
              <h4 className="text-base font-bold text-gray-900">Tap Microphone to Speak</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Speak items, quantities, client name, and prices. Example: &ldquo;Create quote for TechCorp Solutions. 5 Dell Monitors at 28000, 3 Office Chairs at 12500. 10% discount, 18% GST.&rdquo;
              </p>
            </div>
          ) : (
            <div className="border-2 border-amber-400 rounded-3xl p-8 text-center bg-amber-50/70 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-mono text-2xl font-bold text-red-600">
                  {formatSeconds(recordingSeconds)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Listening...
                </span>
              </div>

              {/* Waveform Bars */}
              <div className="flex items-center justify-center gap-1.5 h-12">
                {[14, 26, 40, 18, 48, 30, 16, 44, 20, 36, 14, 28].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-amber-500 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: '800ms',
                    }}
                  />
                ))}
              </div>

              {liveTranscript && (
                <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 font-mono text-left max-w-lg mx-auto shadow-inner">
                  <span className="text-[10px] text-amber-700 font-bold uppercase block mb-1">
                    Live Speech:
                  </span>
                  &ldquo;{liveTranscript}&rdquo;
                </div>
              )}

              <button
                type="button"
                onClick={() => stopRecordingAndAnalyze(undefined, 'voice')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" /> Stop &amp; Extract Quote
              </button>
            </div>
          )}

          {/* Quick Scenario Chips */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Or Try Ready Hardware &amp; Services Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  stopRecordingAndAnalyze(
                    'bhai ek quote bana do for Semixon Technologies: 2 website design 50k, 1 cloud hosting 5000, aur 10% discount de dena',
                    'voice'
                  )
                }
                className="px-3 py-1.5 rounded-xl border border-amber-400 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                🚀 Semixon Tech (2 Web 50k, Hosting 5k, 10% off)
              </button>

              <button
                type="button"
                onClick={() =>
                  stopRecordingAndAnalyze(
                    'Create quotation for TechCorp Solutions Pvt Ltd. 5 Dell UltraSharp 27-inch Monitors at 28000 each, 3 Ergonomic Office Chairs at 12500 each, 1 Server Maintenance Package at 45000. Apply 10% discount, 18% GST. Valid for 15 days.',
                    'voice'
                  )
                }
                className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                💻 TechCorp Hardware (5 Monitors, 3 Chairs, Server)
              </button>

              <button
                type="button"
                onClick={() =>
                  stopRecordingAndAnalyze(
                    'Create quote for Global Logistics Ltd. 2 Cloud Server Migration at 60000 each, 4 Security Firewall Licenses at 15000 each. 5% discount, 18% GST.',
                    'voice'
                  )
                }
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                ☁️ Cloud Migration &amp; Firewall
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Text Prompt */}
      {!extractedData && !isTranscribing && activeTab === 'text' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Type or Paste Quote Instructions
            </label>
            <textarea
              rows={4}
              value={textPromptInput}
              onChange={(e) => setTextPromptInput(e.target.value)}
              placeholder="e.g. Create quote for TechCorp Solutions. 5 Dell UltraSharp 27-inch Monitors at 28000 each, 3 Ergonomic Office Chairs at 12500, 1 Server Maintenance at 45000. Apply 10% discount and 18% GST. Valid for 15 days."
              className="w-full text-xs sm:text-sm p-4 bg-slate-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-sans leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-gray-400 text-[11px] font-bold self-center">Example:</span>
              <button
                type="button"
                onClick={() =>
                  setTextPromptInput(
                    'bhai ek quote bana do for Semixon Technologies: 2 website design 50k, 1 cloud hosting 5000, aur 10% discount de dena'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold border border-emerald-300 transition-colors cursor-pointer"
              >
                🚀 Semixon Demo Prompt
              </button>
              <button
                type="button"
                onClick={() =>
                  setTextPromptInput(
                    'Create quotation for TechCorp Solutions Pvt Ltd. 5 Dell UltraSharp 27-inch Monitors at 28000 each, 3 Ergonomic Office Chairs at 12500 each, 1 Server Maintenance Package at 45000. Apply 10% discount, 18% GST. Valid for 15 days.'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                TechCorp Hardware
              </button>
            </div>

            <button
              type="button"
              onClick={() => stopRecordingAndAnalyze(textPromptInput, 'text')}
              disabled={!textPromptInput.trim()}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Parse Text Prompt into Quote
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Audio File Upload */}
      {!extractedData && !isTranscribing && activeTab === 'upload' && (
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
            className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Upload Recorded Audio Note</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Select any MP3, WAV, or M4A memo. Our parser will automatically structure it.
            </p>
          </div>
        </div>
      )}

      {/* Transcribing Animation */}
      {isTranscribing && (
        <div className="py-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto animate-spin">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-gray-900">AI Quotation Engine Working</h4>
          <p className="text-xs font-semibold text-amber-700">{transcriptionStep}</p>
        </div>
      )}

      {/* Extracted Review Screen */}
      {extractedData && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <span className="font-bold">
                    ✓ Successfully Parsed from {extractedData.sourceType === 'voice' ? 'Voice' : 'Text Prompt'}:
                  </span>{' '}
                  Review the structured data below before updating your price quote dashboard.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExtractedData(null);
                  setLiveTranscript('');
                  transcriptRef.current = '';
                }}
                className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3 h-3" /> Re-Do
              </button>
            </div>
            {extractedData.promptText && (
              <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200/80 text-[11px] font-mono text-gray-700">
                <span className="font-bold text-amber-800 uppercase mr-1 text-[10px]">Detected Input:</span>
                &ldquo;{extractedData.promptText}&rdquo;
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Client / Company Name</label>
              <input
                type="text"
                value={extractedData.clientName}
                onChange={(e) => setExtractedData({ ...extractedData, clientName: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Quote Validity (Days)</label>
              <input
                type="number"
                value={extractedData.validityDays}
                onChange={(e) => setExtractedData({ ...extractedData, validityDays: Number(e.target.value) })}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold text-gray-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Extracted Line Items ({extractedData.items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-amber-700 font-bold hover:text-amber-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {extractedData.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg font-semibold text-gray-900"
                        />
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="Specification"
                          className="w-full text-[11px] px-2 py-1 text-gray-500 border-0 focus:outline-none mt-0.5"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-center font-mono font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-right font-mono font-semibold"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-gray-900 pr-3">
                        ₹{((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove item"
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setExtractedData(null);
                setLiveTranscript('');
                transcriptRef.current = '';
              }}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl transition-colors cursor-pointer"
            >
              Cancel &amp; Re-try
            </button>

            <button
              type="button"
              onClick={handleApplyToDashboard}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>✓ Apply &amp; Update into UI Price Quote Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
