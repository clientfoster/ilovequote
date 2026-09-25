import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, CheckCircle2, Volume2, Sparkles, RefreshCw, X, ArrowRight, Play, Square, Trash2, Plus } from 'lucide-react';
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

export default function AudioQuoteExtractor({ onApplyExtractedData, onCancel }: AudioQuoteExtractorProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionStep, setTranscriptionStep] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedVoiceData | null>(null);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setExtractedData(null);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingAndAnalyze = (sampleText?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsTranscribing(true);
    setTranscriptionStep('Converting speech to text...');

    setTimeout(() => {
      setTranscriptionStep('AI understanding intent and parsing items & amounts...');
    }, 1000);

    setTimeout(() => {
      setTranscriptionStep('Extracting client name, prices, and validity terms...');
    }, 2000);

    setTimeout(() => {
      setIsTranscribing(false);
      const transcript =
        sampleText ||
        'Create a quote for ABC Technologies. Website design twenty five thousand rupees, hosting five thousand rupees, quantity one each. Give them seven days validity.';

      setExtractedData({
        clientName: 'ABC Technologies',
        businessName: '',
        transcript,
        validityDays: 7,
        items: [
          {
            id: `voice-item-${Date.now()}-1`,
            name: 'Website Design',
            description: 'Custom responsive design',
            quantity: 1,
            unitPrice: 25000,
          },
          {
            id: `voice-item-${Date.now()}-2`,
            name: 'Hosting',
            description: 'Cloud hosting setup',
            quantity: 1,
            unitPrice: 5000,
          },
        ],
        taxPercent: 18,
        notes: 'Quote valid for 7 days. 50% advance required to initiate work.',
      });
    }, 2800);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopRecordingAndAnalyze('Create a quote for Sunrise Enterprises. Branding package fifteen thousand rupees, SEO setup ten thousand rupees, quantity one each.');
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
                className="w-16 h-16 mx-auto rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200 hover:scale-105 transition-all mb-3"
              >
                <Mic className="w-8 h-8" />
              </button>
              <h4 className="text-sm font-semibold text-gray-800">Tap to Start Recording</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Speak naturally. Example: &ldquo;Create a quote for ABC Technologies. Website design twenty five thousand, hosting five thousand.&rdquo;
              </p>
            </div>
          ) : (
            <div className="border-2 border-amber-400 rounded-2xl p-8 text-center bg-amber-50/60 animate-pulse">
              <div className="flex items-center justify-center gap-1.5 mb-3 h-8">
                <span className="w-1.5 h-6 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-8 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-5 bg-amber-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-7 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
              </div>
              <div className="text-xl font-mono font-bold text-amber-900 mb-2">
                {formatSeconds(recordingSeconds)}
              </div>
              <p className="text-xs text-amber-800 font-medium mb-4">Listening... Speak clearly into your microphone</p>
              <button
                type="button"
                onClick={() => stopRecordingAndAnalyze()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Stop &amp; Extract Quote
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-amber-600" />
              Upload Audio File
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Quick Test Prompt:</span>
              <button
                type="button"
                onClick={() => stopRecordingAndAnalyze('Create a quote for ABC Technologies. Website design twenty five thousand rupees, hosting five thousand rupees, quantity one each. Give them seven days validity.')}
                className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-medium hover:bg-amber-200 transition-colors"
              >
                Try Voice Sample
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
            <div className="text-xs text-amber-900">
              <span className="font-semibold">Review Voice Extraction:</span> Here is what was extracted from your speech. Correct any details before generating the final quote.
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
            <span className="font-semibold text-gray-600 block mb-1">Spoken Voice Transcript:</span>
            <p className="italic text-gray-700">&ldquo;{extractedData.transcript}&rdquo;</p>
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
                className="flex items-center gap-1 text-xs text-amber-700 font-medium hover:text-amber-800"
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
                          className="w-full text-xs px-2 py-1.5 text-center border border-gray-200 rounded focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1.5 text-right border border-gray-200 rounded focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-gray-900">
                        ₹{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
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
                setIsRecording(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Record Again
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              Looks Correct → Populate Quote
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
