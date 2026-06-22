import React, { useRef, useState } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  FileText,
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ClientFormValues } from '../../../types';

interface ClientFormProps {
  register: UseFormRegister<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
  setValue: UseFormSetValue<ClientFormValues>;
  logoUrl: string | null;
  onLogoChange: (base64: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ClientForm({
  register,
  errors,
  setValue,
  logoUrl,
  onLogoChange,
  onSubmit
}: ClientFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLogoFile = (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Only PNG, JPG or WebP image files are accepted.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image exceeds the maximum allowed size of 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLogoChange(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('An error occurred while reading the logo file.');
    };
    reader.readAsDataURL(file);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLogoChange(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 md:space-y-6" id="client-wizard-form">
      <div
        className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden"
        id="section-client-details"
      >
        <div className="px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Client Information</h3>
              <p className="text-xs text-slate-500 font-medium">Add your client details that will appear in the quote</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-5 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Client / Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Building2 size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Microsoft, ABC Solutions"
                  id="inp-companyName"
                  {...register('companyName', { required: true })}
                  className={`w-full pl-10 pr-4 py-3 min-h-[44px] bg-white border rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all ${
                    errors.companyName ? 'border-red-400 ring-2 ring-red-50' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contact Person <span className="text-slate-400 font-medium normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Your client name"
                  id="inp-contactPerson"
                  {...register('contactPerson')}
                  className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email <span className="text-slate-400 font-medium normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="e.g. john@company.com"
                  id="inp-email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Phone <span className="text-slate-400 font-medium normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <span className="text-lg leading-none">IN</span>
                </span>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  id="inp-phone"
                  {...register('phone')}
                  className="w-full pl-12 pr-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Website <span className="text-slate-400 font-medium normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Globe size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. www.company.com"
                  id="inp-website"
                  {...register('website')}
                  className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-4 md:px-6 md:py-5" id="section-additional-details">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Additional Details <span className="text-slate-400 font-medium">(Optional)</span></h4>
              <p className="text-xs text-slate-500 font-medium">Add more details that will appear in the quote</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tax ID Type
              </label>
              <select
                id="inp-taxIdType"
                {...register('taxIdType')}
                className="w-full px-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
              >
                <option value="GSTIN">GSTIN</option>
                <option value="VAT">VAT</option>
                <option value="PAN">PAN</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tax ID / GST Number
              </label>
              <input
                type="text"
                placeholder="e.g. 27ABCDE1234F1Z5"
                id="inp-taxId"
                {...register('taxId')}
                className="w-full px-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                PO / Reference No.
              </label>
              <input
                type="text"
                placeholder="e.g. PO12345"
                id="inp-poNumber"
                {...register('poNumber')}
                className="w-full px-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5" id="section-billing-address">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Billing Address
              </label>
              <textarea
                rows={3}
                placeholder="Kozhikode, Kerala, India 673006"
                id="inp-billingAddress"
                {...register('billingAddress')}
                className="w-full px-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-4 md:px-6 md:py-5" id="section-client-logo">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ImageIcon size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Upload Client Logo <span className="text-slate-400 font-medium">(Optional)</span></h4>
              <p className="text-xs text-slate-500 font-medium">Upload logo to make your quote look more professional</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 md:gap-4 items-start">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`min-h-24 rounded-xl border-2 border-dashed p-4 md:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#2563EB] bg-blue-50/50'
                  : logoUrl
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20'
              }`}
              id="logo-drag-drop-container"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="logo-file-input"
              />

              {logoUrl ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Client logo preview"
                      className="max-h-20 max-w-[180px] object-contain rounded-lg p-2 bg-white border border-slate-200 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-500 rounded-full p-1 shadow-sm transition-all hover:text-slate-800"
                      title="Remove logo"
                      id="btn-remove-logo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerFileSelect();
                      }}
                    className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
                    >
                      <RefreshCw size={13} />
                      Change Logo
                    </button>
                    <button
                      type="button"
                      onClick={removeLogo}
                    className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2 rounded-lg border border-red-100 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all"
                    >
                      <X size={13} />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      <span className="text-[#2563EB] hover:underline">Upload Logo</span>
                    </p>
                    <p className="text-xs text-slate-400 font-medium">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              )}
            </div>

            <div className="sm:w-28 flex items-start sm:items-center justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setValue('companyName', '');
                  setValue('contactPerson', '');
                  setValue('email', '');
                  setValue('phone', '');
                  setValue('website', '');
                  setValue('taxId', '');
                  setValue('poNumber', '');
                  setValue('billingAddress', '');
                  setValue('taxIdType', 'GSTIN');
                  onLogoChange(null);
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-all"
                title="Reset client image"
              >
                <X size={13} />
                Clear
              </button>
            </div>
          </div>

          {uploadError && (
            <div className="mt-3 text-xs font-semibold text-red-500 flex items-center gap-1.5">
              <AlertCircle size={13} />
              <span>{uploadError}</span>
            </div>
          )}

          <p className="mt-3 text-[10px] text-slate-400 font-medium">
            Recommended: square image, PNG/JPG up to 2MB.
          </p>
        </div>
      </div>
    </form>
  );
}


