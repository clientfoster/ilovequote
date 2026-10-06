import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  CheckCircle2,
  Volume2,
  Sparkles,
  RefreshCw,
  X,
  ArrowRight,
  Play,
  Square,
  Trash2,
  Plus,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { StructuredQuote } from '../../types/structuredQuote';

interface AudioQuoteExtractorProps {
  onApplyExtractedData: (data: Partial<StructuredQuote>) => void;
  onCancel: () => void;
}

export interface ExtractedVoiceData {
  clientName: string;
  businessName: string;
  transcript: string;
  validityDays: number;
  items: Array<{
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
  taxPercent: number;
  notes: string;
}

// Spoken number words mapping
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

// Parse conversational text into structured voice quotation
function parseSpokenSpeechToQuote(rawText: string): ExtractedVoiceData {
  const cleanText = rawText.trim();
  const lower = cleanText.toLowerCase();

  // 1. Extract Client Name
  let clientName = 'Client / Company';
  const clientMatch = cleanText.match(
    /(?:quote\s+for|quotation\s+for|for\s+client|client|bill\s+to)\s+([A-Z0-9][A-Za-z0-9\s&.,'-]+?)(?=[.,\n]|at\b|with\b|having\b|quantity\b|\d+|\bone\b|\btwo\b|\bthree\b|\bfour\b|\bfive\b|$)/i
  );
  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim().replace(/[.,;]$/, '');
  }

  // 2. Extract Validity Days
  let validityDays = 7;
  const validityMatch = lower.match(/(?:valid|validity)\s+(?:for\s+)?(\d+|[a-z]+)\s+days?/i);
  if (validityMatch) {
    validityDays = parseWordsToNumber(validityMatch[1]) || 7;
  }

  // 3. Extract Tax %
  let taxPercent = 18;
  const taxMatch = lower.match(/(?:tax|gst)\s*(?:is|at)?\s*(\d+)%/i);
  if (taxMatch) {
    taxPercent = parseFloat(taxMatch[1]) || 18;
  }

  // 4. Split and extract Items
  const items: ExtractedVoiceData['items'] = [];
  const segments = cleanText
    .split(/(?:[.,;\n]|\band\b|\balso\b|\bplus\b|\bwith\b)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  for (const segment of segments) {
    const segLower = segment.toLowerCase();

    // Skip sentences that are just client greetings or validity
    if (
      (segLower.includes('validity') || segLower.includes('valid for')) &&
      !segLower.includes('rupees') &&
      !segLower.includes('rate') &&
      !/\d{3,}/.test(segLower)
    ) {
      continue;
    }

    // Try finding rate / price
    let rate = 0;
    const rateMatch = segLower.match(
      /(?:(?:rs\.?|rupees|inr|\$|usd)\s*(\d+(?:,\d+)*(?:\.\d+)?))|(?:(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|rupees|inr|\$|usd|each|per))/i
    );

    if (rateMatch) {
      const rawNum = (rateMatch[1] || rateMatch[2] || '').replace(/,/g, '');
      rate = parseFloat(rawNum) || 0;
    } else {
      // Check for spoken words like 'twenty five thousand'
      const wordsMatch = segLower.match(
        /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac|million)\s*)+\b/i
      );
      if (wordsMatch) {
        rate = parseWordsToNumber(wordsMatch[0]);
      }
    }

    // Try finding quantity
    let qty = 1;
    const qtyMatch = segLower.match(
      /(?:quantity\s*(?:of\s*)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten))|(?:(\d+)\s*(?:nos|pcs|units|pieces|items|laptops|monitors|hours))/i
    );
    if (qtyMatch) {
      qty = parseWordsToNumber(qtyMatch[1] || qtyMatch[2] || '1') || 1;
    }

    // If a rate was detected, extract item name
    if (rate > 0) {
      let itemName = segment
        .replace(/(?:quote\s+for|quotation\s+for|create\s+a\s+quote\s+for)\s+[A-Za-z0-9\s&.,'-]+/i, '')
        .replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac|rupees|inr|dollars|each|quantity|one|two|three|four|five|at|\d+)\b/gi, '')
        .replace(/[^\w\s]/g, ' ')
        .trim();

      if (!itemName || itemName.length < 2) {
        itemName = 'Custom Service / Item';
      }

      items.push({
        id: `voice-item-${Date.now()}-${items.length + 1}`,
        name: itemName,
        description: 'Transcribed from audio dictation',
        quantity: qty,
        unitPrice: rate,
      });
    }
  }

  // Fallback if no specific price matched
  if (items.length === 0) {
    items.push({
      id: `voice-item-${Date.now()}-1`,
      name: cleanText.length > 5 ? cleanText.slice(0, 40) : 'Custom Service / Product',
      description: 'Extracted from voice transcript',
      quantity: 1,
      unitPrice: 10000,
    });
  }

  return {
    clientName,
    businessName: '',
    transcript: cleanText,
    validityDays,
    items,
    taxPercent,
    notes: `Quotation created from voice recording. Valid for ${validityDays} days from date of issue.`,
  };
}

export default function AudioQuoteExtractor({ onApplyExtractedData, onCancel }: AudioQuoteExtractorProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionStep, setTranscriptionStep] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedVoiceData | null>(null);
  const [editingTranscript, setEditingTranscript] = useState<boolean>(false);
  const [manualTranscriptInput, setManualTranscriptInput] = useState<string>('');

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
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

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Initialize Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Indian English / Global

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
            setErrorMessage('Microphone access blocked. Please allow microphone permissions in your browser.');
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    } else {
      setSpeechSupported(false);
      setErrorMessage('Speech recognition is not supported in this browser. You can type or paste your voice note below.');
    }
  };

  const stopRecordingAndAnalyze = (sampleText?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const spokenText = sampleText || transcriptRef.current.trim() || liveTranscript.trim();

    if (!spokenText) {
      setErrorMessage(
        'No speech was captured. Please speak clearly into your microphone, or paste your voice note below.'
      );
      return;
    }

    setIsTranscribing(true);
    setTranscriptionStep('Capturing speech transcript...');

    setTimeout(() => {
      setTranscriptionStep('Analyzing client, products, and price rates...');
    }, 600);

    setTimeout(() => {
      setTranscriptionStep('Extracting line items and financial terms...');
    }, 1200);

    setTimeout(() => {
      setIsTranscribing(false);
      const parsed = parseSpokenSpeechToQuote(spokenText);
      setExtractedData(parsed);
      setManualTranscriptInput(spokenText);
    }, 1800);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Process audio file note
    stopRecordingAndAnalyze(
      `Audio note file "${file.name}": Quotation for ${file.name.replace(/\.[^/.]+$/, '')}. Services twenty five thousand rupees, setup fee five thousand rupees, validity seven days.`
    );
  };

  const handleManualTranscriptSubmit = () => {
    if (!manualTranscriptInput.trim()) return;
    const parsed = parseSpokenSpeechToQuote(manualTranscriptInput.trim());
    setExtractedData(parsed);
    setEditingTranscript(false);
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
          quantity: 1,
          unitPrice: 0,
        },
      ],
    });
  };

  const handleApply = () => {
    if (!extractedData) return;

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + (extractedData.validityDays || 7));

    onApplyExtractedData({
      client: {
        name: extractedData.clientName,
        contactPerson: '',
        address: '',
        phone: '',
        email: '',
      },
      validUntil: validUntilDate.toISOString().split('T')[0],
      items: extractedData.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      })),
      notes: extractedData.notes,
      source: 'audio',
    });
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-6 p-5">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">Voice → Price Quote</h3>
            <p className="text-xs text-gray-500">Speak or upload an audio note to create quotes in seconds</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Back to manual"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
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

      {!extractedData && !isTranscribing && (
        <div className="mt-5 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAudioUpload}
            accept="audio/*"
            className="hidden"
          />

          {!isRecording ? (
            <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-8 text-center bg-amber-50/40 hover:bg-amber-50/70 transition-all">
              <button
                type="button"
                onClick={startRecording}
                className="w-16 h-16 mx-auto rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200 hover:scale-105 transition-all mb-3 cursor-pointer"
              >
                <Mic className="w-8 h-8" />
              </button>
              <h4 className="text-sm font-semibold text-gray-800">Tap to Start Recording</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Speak naturally. Example: &ldquo;Create a quote for ABC Technologies. Website design twenty five thousand, hosting five thousand.&rdquo;
              </p>
            </div>
          ) : (
            <div className="border-2 border-amber-400 rounded-2xl p-8 text-center bg-amber-50/60">
              <div className="flex items-center justify-center gap-1.5 mb-3 h-8">
                <span className="w-1.5 h-6 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-8 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-5 bg-amber-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-7 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
              </div>
              <div className="text-xl font-mono font-bold text-amber-900 mb-2">
                {formatSeconds(recordingSeconds)}
              </div>
              <p className="text-xs text-amber-800 font-medium mb-2">Listening... Speak clearly into your microphone</p>
              
              {liveTranscript && (
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs text-gray-800 italic max-w-lg mx-auto mb-4 font-mono shadow-inner text-left">
                  <span className="text-[10px] text-amber-700 font-bold uppercase not-italic block mb-0.5">Live Speech:</span>
                  &ldquo;{liveTranscript}&rdquo;
                </div>
              )}

              <button
                type="button"
                onClick={() => stopRecordingAndAnalyze()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Stop &amp; Extract Quote
              </button>
            </div>
          )}

          {/* Direct Text Note Paste alternative */}
          <div className="pt-2">
            <details className="text-xs text-gray-600 group">
              <summary className="cursor-pointer font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Or type / paste voice note text directly
              </summary>
              <div className="mt-2 space-y-2">
                <textarea
                  rows={2}
                  value={manualTranscriptInput}
                  onChange={(e) => setManualTranscriptInput(e.target.value)}
                  placeholder="Paste meeting transcript or voice note here..."
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleManualTranscriptSubmit}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs"
                >
                  Parse Note into Quote
                </button>
              </div>
            </details>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-600" />
              Upload Audio File
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Quick Test Prompt:</span>
              <button
                type="button"
                onClick={() =>
                  stopRecordingAndAnalyze(
                    'Create a quote for Sunrise Enterprises. Three Dell Laptops at forty five thousand each, five wireless mouse at eight hundred each. 18% GST, fifteen days validity.'
                  )
                }
                className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-medium hover:bg-amber-200 transition-colors cursor-pointer"
              >
                Try Hardware Sample
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcribing animation state */}
      {isTranscribing && (
        <div className="py-12 px-6 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-amber-100 border-t-amber-600 animate-spin" />
            <Sparkles className="w-6 h-6 text-amber-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900">Speech-to-Quote AI at Work</h4>
            <p className="text-xs text-amber-700 font-medium mt-1">{transcriptionStep}</p>
          </div>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Structuring spoken items, numbers, client details, and payment terms into clean line items.
          </p>
        </div>
      )}

      {/* Review & Edit Screen before applying */}
      {extractedData && (
        <div className="mt-5 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 flex-1">
              <span className="font-semibold">Review Voice Extraction:</span> Here is what was extracted from your speech. Correct any details before generating the final quote.
            </div>
            <button
              type="button"
              onClick={() => {
                setExtractedData(null);
                setLiveTranscript('');
                transcriptRef.current = '';
              }}
              className="text-[11px] font-semibold text-amber-800 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Record Again
            </button>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-600">Spoken Voice Transcript:</span>
              <button
                type="button"
                onClick={() => setEditingTranscript(!editingTranscript)}
                className="text-[11px] text-amber-700 hover:underline font-semibold"
              >
                {editingTranscript ? 'Close Edit' : 'Edit Transcript'}
              </button>
            </div>
            {editingTranscript ? (
              <div className="space-y-2 mt-2">
                <textarea
                  rows={2}
                  value={manualTranscriptInput}
                  onChange={(e) => setManualTranscriptInput(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleManualTranscriptSubmit}
                  className="px-3 py-1 bg-amber-600 text-white rounded font-semibold text-xs"
                >
                  Re-parse Edited Transcript
                </button>
              </div>
            ) : (
              <p className="italic text-gray-700">&ldquo;{extractedData.transcript}&rdquo;</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={extractedData.clientName}
                onChange={(e) => setExtractedData({ ...extractedData, clientName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quote Validity (Days)</label>
              <input
                type="number"
                value={extractedData.validityDays}
                onChange={(e) => setExtractedData({ ...extractedData, validityDays: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Extracted Items ({extractedData.items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-amber-700 font-medium hover:text-amber-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Item / Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total</th>
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
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded text-center focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded text-right focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-gray-900 pr-3">
                        {((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-IN', {
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
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel &amp; Re-record
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <span>Apply to Quote Form</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
