import React, { useRef, useState } from 'react';
import { CloudUpload, X, RefreshCw, Image as ImageIcon } from 'lucide-react';

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

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or SVG image.');
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
      <label className="text-[12px] font-semibold text-slate-600" htmlFor="logo-file-input">
        Business Logo <span className="text-slate-400">(Optional)</span>
      </label>

      <div
        id="logo-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerInput}
        className={`rounded-[18px] border border-dashed p-5 sm:p-6 transition-all duration-200 ${
          isDragging
            ? 'border-[#2563EB] bg-blue-50/70'
            : value
              ? 'border-emerald-200 bg-emerald-50/20'
              : 'border-slate-200 bg-slate-50/40 hover:border-[#2563EB] hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg, image/svg+xml"
          className="hidden"
          id="logo-file-input"
          data-testid="logo-file-input"
        />

        {value ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <img
                  src={value}
                  alt="Uploaded Business Logo"
                  className="max-h-full max-w-full object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Logo uploaded successfully</p>
                <p className="text-xs text-slate-500">PNG, JPG, or SVG. Maximum size 2MB.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                id="btn-change-logo"
                onClick={triggerInput}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change
              </button>
              <button
                type="button"
                id="btn-remove-logo"
                onClick={removeLogo}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-red-100 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                <X className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <CloudUpload className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Drag &amp; drop your logo here</p>
                <p className="text-xs leading-5 text-slate-500">PNG, JPG, SVG</p>
                <p className="text-[11px] text-slate-400">Maximum size: 2MB</p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                onClick={(event) => {
                  event.stopPropagation();
                  triggerInput();
                }}
              >
                Browse Files
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-650 bg-red-50 border border-red-105/50 rounded-lg p-2.5 font-medium flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}
    </div>
  );
}
