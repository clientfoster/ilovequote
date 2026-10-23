import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Download,
  Share2,
  Printer,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Eye,
  X,
  Copy,
  Check,
} from 'lucide-react';
import {
  ExtractedPictureQuoteData,
  SAMPLE_PICTURE_PRESETS,
  getSamplePreset,
  extractQuoteFromImageFile,
} from '../services/pictureQuoteService';
import { StructuredQuoteItem } from '../types/structuredQuote';

// Number to Words in Indian format
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return single[n];
    if (n < 20) return double[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + single[n % 10] : '');
  }

  const intPart = Math.floor(num);
  let words = '';

  const crore = Math.floor(intPart / 10000000);
  const lakh = Math.floor((intPart % 10000000) / 100000);
  const thousand = Math.floor((intPart % 100000) / 1000);
  const hundred = Math.floor((intPart % 1000) / 100);
  const rem = intPart % 100;

  if (crore > 0) words += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundred > 0) words += convertTwoDigits(hundred) + ' Hundred ';
  if (rem > 0) words += convertTwoDigits(rem) + ' ';

  return words.trim() + ' Rupees Only';
}

export default function PictureQuoteConverterPage() {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'samples'>('samples');
  const [quoteData, setQuoteData] = useState<ExtractedPictureQuoteData>(() => {
    return getSamplePreset('sample-semixon').data;
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingPercent, setProcessingPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Image viewer controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showFullscreenModal, setShowFullscreenModal] = useState<boolean>(false);
  const [showOcrTextDrawer, setShowOcrTextDrawer] = useState<boolean>(false);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Hidden file input and printable ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const printableDocRef = useRef<HTMLDivElement | null>(null);

  // Initialize first preset image URL on mount
  useEffect(() => {
    const semixonPreset = getSamplePreset('sample-semixon');
    setQuoteData(semixonPreset.data);
  }, []);

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleProcessFile(blob, 'pasted_screenshot.png');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Camera Handlers
  const startCamera = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMessage('Could not access camera. Please allow camera permissions or upload an image file.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();

    canvas.toBlob((blob) => {
      if (blob) {
        handleProcessFile(blob, `camera_capture_${Date.now()}.png`);
      }
    }, 'image/png');
  };

  // Process File (Upload or Capture)
  const handleProcessFile = async (file: File | Blob, customName?: string) => {
    setIsProcessing(true);
    setErrorMessage('');
    setProcessingPercent(10);
    setProcessingStatus('Reading photograph and optimizing resolution...');

    try {
      const parsed = await extractQuoteFromImageFile(file, (step, pct) => {
        setProcessingStatus(step);
        setProcessingPercent(pct);
      });

      if (customName) parsed.imageName = customName;
      setQuoteData(parsed);
      setZoomLevel(1);
      setRotation(0);
      triggerToast('Document scanned and quotation structured successfully!');
    } catch (err: any) {
      console.error('OCR Processing error:', err);
      setErrorMessage('Failed to extract quotation from this image. Please try a clearer photograph or sample.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleProcessFile(file, file.name);
  };

  // Preset Selector
  const handleSelectPreset = (presetId: string) => {
    const preset = getSamplePreset(presetId);
    setQuoteData({ ...preset.data });
    setZoomLevel(1);
    setRotation(0);
    triggerToast(`Loaded demo: ${preset.title}`);
  };

  // Calculations
  const subtotal = quoteData.items.reduce((sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0), 0);
  const discountAmount = (subtotal * (quoteData.discountPercent || 0)) / 100;
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * (quoteData.taxPercent || 0)) / 100;
  const grandTotal = taxable + taxAmount;

  // Item Table Handlers
  const handleItemChange = (idx: number, field: keyof StructuredQuoteItem, val: any) => {
    const updated = [...quoteData.items];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(field === 'quantity' ? val : updated[idx].quantity) || 1;
      const p = Number(field === 'unitPrice' ? val : updated[idx].unitPrice) || 0;
      updated[idx].amount = q * p;
    }
    setQuoteData({ ...quoteData, items: updated });
  };

  const handleAddItem = () => {
    const newItem: StructuredQuoteItem = {
      id: `ocr-item-${Date.now()}-${quoteData.items.length + 1}`,
      name: 'Additional Hardware / Service',
      description: 'Standard specification and warranty delivery',
      quantity: 1,
      unitPrice: 10000,
      amount: 10000,
      hsnSac: '8471',
    };
    setQuoteData({ ...quoteData, items: [...quoteData.items, newItem] });
  };

  const handleRemoveItem = (idx: number) => {
    if (quoteData.items.length <= 1) return;
    const updated = quoteData.items.filter((_, i) => i !== idx);
    setQuoteData({ ...quoteData, items: updated });
  };

  // Apply to Dashboard (Syncs to /create-quote2)
  const handleEditInDashboard = () => {
    const draftPayload = {
      client: {
        name: quoteData.clientName,
        contactPerson: quoteData.clientContactPerson || 'Procurement',
        address: quoteData.clientAddress || 'Corporate Office, Phase 2, Noida, UP',
        phone: quoteData.clientPhone || '+91 98765 43210',
        email: quoteData.clientEmail || 'billing@clientcompany.example',
      },
      quoteNumber: quoteData.quoteNumber,
      date: quoteData.quoteDate,
      validUntil: quoteData.quoteDate,
      items: quoteData.items.map((it) => ({
        id: it.id,
        name: it.name,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.amount,
        hsnSac: it.hsnSac || '8471',
      })),
      pricing: {
        subtotal,
        discountPercent: quoteData.discountPercent,
        discountAmount,
        taxPercent: quoteData.taxPercent,
        taxAmount,
        totalAmount: grandTotal,
      },
      notes: quoteData.notes,
      source: 'picture' as any,
    };

    try {
      localStorage.setItem('ilovequote_structured_quote_draft_v1', JSON.stringify(draftPayload));
      sessionStorage.setItem('ilovequote_active_quote_edit', JSON.stringify(draftPayload));
      sessionStorage.setItem(
        'ilovequote_flash_toast',
        `✓ Picture Quote for ${quoteData.clientName} loaded into Price Quote Dashboard!`
      );
    } catch {
      // ignore
    }

    navigate('/create-quote2', { state: { importedQuote: draftPayload } });
  };

  // Download Vector PDF
  const handleDownloadPdf = async () => {
    if (!printableDocRef.current || isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      const safeClient = (quoteData.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Quotation_${quoteData.quoteNumber}_${safeClient}.pdf`;

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

      pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, Math.min(renderHeight, availableHeight));
      pdf.save(fileName);
      triggerToast('PDF downloaded successfully in executive vector resolution!');
    } catch (err) {
      console.error('PDF export error:', err);
      setErrorMessage('Could not generate PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyJson = () => {
    const payload = JSON.stringify(quoteData, null, 2);
    navigator.clipboard.writeText(payload);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    triggerToast('Quotation JSON copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-6 lg:px-8 font-sans text-slate-800">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Version: Page 3 • Picture to Quote
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Isolated Module
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Camera className="w-8 h-8 text-purple-600 shrink-0" />
              Picture &amp; Photo Quotation Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Upload invoice photos, purchase slips, or take a picture with your camera. Our AI Vision &amp; OCR Engine
              extracts the client, line items, and pricing directly into an executive quotation.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleEditInDashboard}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Edit in Price Quote Dashboard</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Scan Source Tabs & Upload Controls */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('samples');
                }}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'samples'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>1-Click Sample Demos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('upload');
                }}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'upload'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4 text-purple-600" />
                <span>Upload Image / Drop</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  startCamera();
                }}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'camera'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-purple-600" />
                <span>Live Camera Snap</span>
              </button>
            </div>

            <div className="text-[11px] font-semibold text-slate-400">
              Tip: You can also press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border font-mono">Ctrl + V</kbd>{' '}
              anywhere to paste a screenshot
            </div>
          </div>

          {/* TAB 1: SAMPLES */}
          {activeTab === 'samples' && (
            <div className="space-y-3 animate-in fade-in">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Select a Realistic Document to Test 1-Click Extraction:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SAMPLE_PICTURE_PRESETS.map((preset) => {
                  const isSelected = quoteData.quoteNumber === preset.data.quoteNumber;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-100'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50/80 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {preset.badge}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-purple-600 font-bold" />}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{preset.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        Client: <strong className="text-slate-700">{preset.data.clientName}</strong>
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">{preset.data.items.length} Line Items</span>
                        <span className="font-bold font-mono text-purple-900">
                          ₹
                          {preset.data.items
                            .reduce((s, it) => s + it.quantity * it.unitPrice, 0)
                            .toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD & DRAG DROP */}
          {activeTab === 'upload' && (
            <div className="space-y-4 animate-in fade-in">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png, image/jpeg, image/webp, image/jpg"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/70 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Drop your quotation or invoice image here</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PNG, JPG, JPEG, WEBP or scanned bill photos up to 25MB
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Browse From Computer / Phone</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-slate-900 rounded-3xl overflow-hidden relative shadow-lg aspect-video max-h-[420px] flex items-center justify-center">
                {isCameraActive ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400 p-6 space-y-3">
                    <Camera className="w-12 h-12 mx-auto text-slate-600" />
                    <p className="text-xs sm:text-sm">Camera preview stopped.</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                    >
                      Restart Camera
                    </button>
                  </div>
                )}

                {/* Viewfinder Overlay Frame */}
                {isCameraActive && (
                  <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                      Align invoice or quote inside box
                    </span>
                  </div>
                )}
              </div>

              {isCameraActive && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture &amp; Extract Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing Progress Bar */}
          {isProcessing && (
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                  {processingStatus}
                </span>
                <span>{processingPercent}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${processingPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* WORKSPACE: 2-COLUMN SPLIT (Left: Visual Picture, Right: Structured Quotation) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Visual Picture Inspector (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">Source Document Picture</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {quoteData.confidenceScore}% Confidence
                  </span>
                </div>
              </div>

              {/* Picture Display Box with Zoom & Rotation */}
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 min-h-[380px] flex items-center justify-center p-3 group">
                {quoteData.imageUrl ? (
                  <img
                    src={quoteData.imageUrl}
                    alt={quoteData.imageName}
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-out',
                    }}
                    className="max-h-[460px] w-auto max-w-full object-contain rounded-lg shadow-2xl select-none"
                  />
                ) : (
                  <div className="text-center text-slate-500 text-xs">No image loaded</div>
                )}

                {/* Floating Image Control Bar */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-2xl flex items-center gap-2 text-white shadow-xl">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                    className="p-1 hover:text-purple-300 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                    className="p-1 hover:text-purple-300 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px h-3.5 bg-slate-600" />
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1 hover:text-purple-300 transition-colors"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFullscreenModal(true)}
                    className="p-1 hover:text-purple-300 transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>File: {quoteData.imageName || 'quotation_photo.png'}</span>
                <span className="font-semibold text-slate-700">Source: {quoteData.detectionSource.toUpperCase()}</span>
              </div>

              {/* Drawer for Raw OCR Text */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOcrTextDrawer(!showOcrTextDrawer)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-purple-900 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>View Raw OCR Text Lines</span>
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    {showOcrTextDrawer ? 'Hide ▲' : 'Show ▼'}
                  </span>
                </button>

                {showOcrTextDrawer && (
                  <pre className="mt-2.5 p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed animate-in fade-in">
                    {quoteData.rawOcrText || 'No raw OCR text available.'}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Extracted Structured Price Quote (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
              {/* Review Title & Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900">Extracted Quotation Details</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      Editable
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify client name, quantities, rates, and taxes. Updates sync directly to PDF.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy Quote JSON"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Print Document"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Client & Metadata Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client / Company Name</label>
                  <input
                    type="text"
                    value={quoteData.clientName}
                    onChange={(e) => setQuoteData({ ...quoteData, clientName: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quotation Reference #</label>
                  <input
                    type="text"
                    value={quoteData.quoteNumber}
                    onChange={(e) => setQuoteData({ ...quoteData, quoteNumber: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quote Date</label>
                  <input
                    type="date"
                    value={quoteData.quoteDate}
                    onChange={(e) => setQuoteData({ ...quoteData, quoteDate: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity Period (Days)</label>
                  <input
                    type="number"
                    value={quoteData.validityDays}
                    onChange={(e) => setQuoteData({ ...quoteData, validityDays: Number(e.target.value) })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Extracted Line Items ({quoteData.items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0f172a] text-white font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                        <th className="py-2.5 px-3 w-28 text-right">Unit Rate (₹)</th>
                        <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quoteData.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              placeholder="Item name"
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-900"
                            />
                            <input
                              type="text"
                              value={item.description || ''}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              placeholder="Scope & Specifications"
                              className="w-full text-[11px] px-2.5 py-1 text-slate-500 border-0 focus:outline-none mt-0.5"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-right font-mono font-semibold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900 pr-3">
                            ₹
                            {((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
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
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Discount:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={quoteData.discountPercent}
                      onChange={(e) => setQuoteData({ ...quoteData, discountPercent: Number(e.target.value) })}
                      className="w-14 px-2 py-0.5 border border-slate-300 rounded text-center text-xs font-mono font-bold"
                    />
                    <span>%</span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-600">
                    - ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Tax (GST):</span>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={quoteData.taxPercent}
                      onChange={(e) => setQuoteData({ ...quoteData, taxPercent: Number(e.target.value) })}
                      className="w-14 px-2 py-0.5 border border-slate-300 rounded text-center text-xs font-mono font-bold"
                    />
                    <span>%</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900">
                    + ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">Grand Total:</span>
                  <span className="text-lg font-extrabold font-mono text-[#0f172a]">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Amount in words */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-700 italic">
                  <span className="font-bold text-slate-900 not-italic mr-1.5">In Words:</span>
                  {numberToIndianWords(grandTotal)}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Executive PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEditInDashboard}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <span>✓ Apply &amp; Update into UI Price Quote Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowFullscreenModal(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={quoteData.imageUrl}
              alt={quoteData.imageName}
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* HIDDEN PRINTABLE CONTAINER FOR CRISP VECTOR PDF EXPORT */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div
          ref={printableDocRef}
          style={{
            width: '794px',
            minHeight: '1123px',
            backgroundColor: '#ffffff',
            padding: '36px',
            boxSizing: 'border-box',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#1e293b',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '24px 30px',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.5px' }}>
                iLoveQuote Technologies
              </h1>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                Sector 62, Noida, UP, 201309 | GSTIN: 09AAACI1234F1Z5 | billing@ilovequote.com
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#f59e0b',
                  letterSpacing: '1px',
                }}
              >
                PRICE QUOTATION
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                Ref: {quoteData.quoteNumber}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Date: {quoteData.quoteDate}
              </div>
            </div>
          </div>

          {/* Client & Metadata Cards */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div
              style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Quotation Prepared For (Client)
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                {quoteData.clientName}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                {quoteData.clientAddress || 'Corporate Office, Phase 2, Noida, UP, India'}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                Phone: {quoteData.clientPhone || '+91 98765 43210'}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Estimate Validity &amp; Currency
              </div>
              <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
                <strong>Validity:</strong> {quoteData.validityDays} Days from Issue Date
              </div>
              <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
                <strong>Currency:</strong> Indian Rupee (INR - ₹)
              </div>
              <div style={{ fontSize: '12px', color: '#334155' }}>
                <strong>Source:</strong> Picture / Image Document Scan
              </div>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', borderRadius: '6px 0 0 0' }}>
                  #
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px' }}>
                  Item Description &amp; Scope
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', width: '50px' }}>Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', width: '100px' }}>
                  Unit Rate (₹)
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', width: '110px', borderRadius: '0 6px 0 0' }}>
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {quoteData.items.map((it, idx) => (
                <tr
                  key={it.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{it.name}</div>
                    {it.description && (
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{it.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                    {it.quantity}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px' }}>
                    ₹{it.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>
                    ₹{((it.quantity || 1) * (it.unitPrice || 0)).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Summary & Terms */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' }}>
                  Amount in Words:
                </div>
                <div style={{ fontSize: '11px', color: '#334155', fontStyle: 'italic' }}>
                  {numberToIndianWords(grandTotal)}
                </div>
              </div>

              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.5' }}>
                <strong>Bank Transfer Details:</strong>
                <br />
                Bank Name: HDFC Bank | A/C No: 50200088991122 | IFSC: HDFC0001234
                <br />
                Account Holder: iLoveQuote Technologies | Branch: Noida Sector 62
              </div>
            </div>

            <div
              style={{
                width: '280px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontWeight: 'bold' }}>
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {quoteData.discountPercent > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#16a34a',
                    marginBottom: '6px',
                  }}
                >
                  <span>Discount ({quoteData.discountPercent}%):</span>
                  <span>- ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>GST ({quoteData.taxPercent}%):</span>
                <span>+ ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  paddingTop: '8px',
                  borderTop: '2px solid #0f172a',
                }}
              >
                <span>Grand Total:</span>
                <span style={{ color: '#0f172a' }}>
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Authorized Signature Footer */}
          <div
            style={{
              marginTop: '36px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Computer generated quotation document • Valid without physical signature if verified
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '35px' }}>
                For iLoveQuote Technologies
              </div>
              <div style={{ width: '180px', borderTop: '1px solid #0f172a', paddingTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                  Authorized Signatory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
