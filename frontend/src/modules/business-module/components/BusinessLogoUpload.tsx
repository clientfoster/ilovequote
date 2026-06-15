import React, { useRef, useState } from 'react';
import { Upload, X, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';

interface BusinessLogoUploadProps {
  value?: string;
  onChange: (base64: string) => void;
}

export default function BusinessLogoUpload({ value, onChange }: BusinessLogoUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG or JPG/JPEG image.');
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        onChange(result);
      } else {
        setError('Failed to parse image file.');
      }
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const removeLogo = () => {
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3" id="logo-upload-group">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[13px] font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          Business Logo <span className="text-slate-400">(Optional)</span>
        </label>
        <span className="text-xs text-slate-400 font-medium font-mono">PNG, JPG (Recommended: 200x200px)</span>
      </div>

      {value ? (
        <div
          className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 relative transition-all"
          id="logo-preview-card"
        >
          <div className="relative w-24 h-24 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group">
            <img
              src={value}
              alt="Uploaded Business Logo"
              className="max-w-full max-h-full object-contain p-2"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-[10px] text-white font-medium uppercase tracking-wider">Preview logo</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1">
              Logo uploaded successfully
              <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8] fill-[#1D4ED8]/20" />
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Your logo has been embedded inside the layout system and live-syncs with your invoice preview.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <button
                type="button"
                id="btn-change-logo"
                onClick={triggerInput}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-105"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change Logo
              </button>
              <button
                type="button"
                id="btn-remove-logo"
                onClick={removeLogo}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100/70 border border-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Remove Logo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="logo-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerInput}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#1D4ED8] bg-blue-50/30'
              : 'border-slate-200 hover:border-[#1D4ED8] hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#1D4ED8] shrink-0">
              <Upload className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Upload Logo</p>
              <p className="text-[11px] leading-4 text-slate-400 font-medium">PNG, JPG (Recommended: 200x200px)</p>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg"
        className="hidden"
        id="logo-file-input"
        data-testid="logo-file-input"
      />

      {error && (
        <div className="text-xs text-red-650 bg-red-50 border border-red-105/50 rounded-lg p-2.5 font-medium flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}
    </div>
  );
}
