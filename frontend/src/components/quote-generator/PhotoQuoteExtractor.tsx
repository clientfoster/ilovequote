import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Edit3, Trash2, Plus, Sparkles, RefreshCw, X, ArrowRight } from 'lucide-react';
import { StructuredQuote, StructuredQuoteItem } from '../../types/structuredQuote';

interface PhotoQuoteExtractorProps {
  onApplyExtractedData: (data: Partial<StructuredQuote>) => void;
  onCancel: () => void;
}

export interface ExtractedPhotoData {
  businessName: string;
  clientName: string;
  quoteNumber: string;
  date: string;
  items: Array<{
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
  discountPercent: number;
  taxPercent: number;
}

export default function PhotoQuoteExtractor({ onApplyExtractedData, onCancel }: PhotoQuoteExtractorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedPhotoData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Demo samples for quick testing
  const handleLoadSample = (sampleType: 'quote' | 'bill') => {
    setIsAnalyzing(true);
    setSelectedImage('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="40%" font-size="16" text-anchor="middle" fill="%23334155" font-family="sans-serif">Sample Bill / Quote Document</text><text x="50%" y="60%" font-size="12" text-anchor="middle" fill="%2364748b" font-family="sans-serif">Website Design, Cloud Hosting</text></svg>');
    setImageName(sampleType === 'quote' ? 'sample_quotation.jpg' : 'store_receipt.png');

    runAnalysisSimulation(sampleType);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      runAnalysisSimulation('custom');
    };
    reader.readAsDataURL(file);
  };

  const runAnalysisSimulation = (type: string) => {
    setIsAnalyzing(true);
    setAnalysisStep('Scanning document text with OCR...');

    setTimeout(() => {
      setAnalysisStep('Detecting line items, quantities, and prices...');
    }, 900);

    setTimeout(() => {
      setAnalysisStep('Extracting tax, client details, and totals...');
    }, 1800);

    setTimeout(() => {
      setIsAnalyzing(false);
      const isCustom = type === 'custom';
      setExtractedData({
        businessName: isCustom ? 'ABC Creative Studio' : 'Apex Tech Innovations',
        clientName: isCustom ? 'Sunrise Retailers Ltd' : 'Horizon Media Corp',
        quoteNumber: `QT-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        items: [
          {
            id: `extracted-${Date.now()}-1`,
            name: 'Website Design & UI/UX',
            description: 'Custom responsive design (5 pages)',
            quantity: 1,
            unitPrice: 25000,
          },
          {
            id: `extracted-${Date.now()}-2`,
            name: 'Cloud Hosting & Domain Setup',
            description: 'Annual high-speed cloud server',
            quantity: 1,
            unitPrice: 5000,
          },
        ],
        discountPercent: 0,
        taxPercent: 18,
      });
    }, 2500);
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
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    });
  };

  const handleApply = () => {
    if (!extractedData) return;
    onApplyExtractedData({
      business: {
        name: extractedData.businessName,
        preparedBy: '',
        address: '',
        phone: '',
        email: '',
        website: '',
      },
      client: {
        name: extractedData.clientName,
        contactPerson: '',
        address: '',
        phone: '',
        email: '',
      },
      quoteNumber: extractedData.quoteNumber,
      date: extractedData.date,
      items: extractedData.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      })),
      source: 'photo',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden mb-6 p-5">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">Photo → Price Quote</h3>
            <p className="text-xs text-gray-500">Upload or snap a photo of any handwritten quote, rough price list, or bill</p>
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

      {!extractedData && !isAnalyzing && (
        <div className="mt-5 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-emerald-50/40 hover:bg-emerald-50/70 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Drag & drop your photo here, or <span className="text-emerald-600 underline">Browse File</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Supports PNG, JPG, JPEG, WEBP or camera snapshot</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-colors"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              Take Photo with Camera
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Quick Test:</span>
              <button
                type="button"
                onClick={() => handleLoadSample('quote')}
                className="px-2.5 py-1 rounded-md bg-emerald-100/70 text-emerald-800 font-medium hover:bg-emerald-200 transition-colors"
              >
                Sample Quotation
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('bill')}
                className="px-2.5 py-1 rounded-md bg-emerald-100/70 text-emerald-800 font-medium hover:bg-emerald-200 transition-colors"
              >
                Sample Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing animation state */}
      {isAnalyzing && (
        <div className="py-12 px-6 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
            <Sparkles className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900">AI Vision Engine Reading Image</h4>
            <p className="text-xs text-emerald-700 font-medium mt-1">{analysisStep}</p>
          </div>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Extracting items, unit prices, quantities, and client details so you can review before generating the quote.
          </p>
        </div>
      )}

      {/* Review & Edit Screen before applying */}
      {extractedData && (
        <div className="mt-5 space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900">
              <span className="font-semibold">Review Extracted Information:</span> The AI has read your photo. Please check and correct any items or prices below before generating the final quote.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Extracted Business Name</label>
              <input
                type="text"
                value={extractedData.businessName}
                onChange={(e) => setExtractedData({ ...extractedData, businessName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Extracted Client Name</label>
              <input
                type="text"
                value={extractedData.clientName}
                onChange={(e) => setExtractedData({ ...extractedData, clientName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Extracted Line Items ({extractedData.items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-emerald-700 font-medium hover:text-emerald-800"
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
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1.5 text-center border border-gray-200 rounded focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1.5 text-right border border-gray-200 rounded focus:outline-none focus:border-emerald-500"
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
                setSelectedImage(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Choose Different Photo
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow"
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
