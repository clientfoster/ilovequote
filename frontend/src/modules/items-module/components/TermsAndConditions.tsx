import React, { useRef } from 'react';
import { ClipboardCheck, GripVertical, Image as ImageIcon, Trash2, Plus, FileText, X } from 'lucide-react';

export interface TermItem {
  id: string;
  text: string;
  image?: string; // Base64 data URL
}

interface TermsAndConditionsProps {
  terms: TermItem[];
  onChange: (terms: TermItem[]) => void;
}

export default function TermsAndConditions({ terms, onChange }: TermsAndConditionsProps) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleAddTerm = () => {
    const newTerm: TermItem = {
      id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: '',
    };
    onChange([...terms, newTerm]);
  };

  const handleTermTextChange = (id: string, text: string) => {
    onChange(terms.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const handleDeleteTerm = (id: string) => {
    onChange(terms.filter((t) => t.id !== id));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onChange(terms.map((t) => (t.id === id ? { ...t, image: base64 } : t)));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (id: string) => {
    onChange(terms.map((t) => (t.id === id ? { ...t, image: undefined } : t)));
  };

  const triggerFileInput = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 md:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-indigo-50 border-indigo-100 text-indigo-600">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Terms & Conditions
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Add terms and conditions that will appear on your quote.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddTerm}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer shadow-tiny"
        >
          <Plus size={15} className="text-slate-500" />
          Add Term
        </button>
      </div>

      {/* Empty State */}
      {terms.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white border border-slate-100 text-slate-400 mb-4 shadow-sm">
            <FileText size={36} className="text-indigo-200" />
            <div className="absolute bottom-5 right-5 bg-indigo-500 text-white rounded-full p-1 border-2 border-white shadow-xs">
              <Plus size={10} className="stroke-[3]" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-700">No terms added yet</p>
          <p className="mt-1 text-xs text-slate-400 max-w-[320px] mx-auto leading-relaxed">
            Add any payment terms, delivery conditions, warranty details, or special notes that will appear in your quotation.
          </p>
          <button
            type="button"
            onClick={handleAddTerm}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <Plus size={15} />
            Add First Term
          </button>
        </div>
      ) : (
        /* Terms List */
        <div className="space-y-3.5">
          {terms.map((term, index) => (
            <div key={term.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                {/* Drag Handle Mock */}
                <span className="text-slate-400 cursor-grab active:cursor-grabbing p-1">
                  <GripVertical size={16} />
                </span>

                {/* Index Badge */}
                <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 font-mono">
                  {index + 1}
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  placeholder="Enter term and condition here..."
                  value={term.text}
                  onChange={(e) => handleTermTextChange(term.id, e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-blue-500 focus:bg-white text-slate-800"
                />

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={(el) => (fileInputRefs.current[term.id] = el)}
                  onChange={(e) => handleImageUpload(term.id, e)}
                  accept="image/*"
                  className="hidden"
                />

                {/* Photo Upload Button */}
                <button
                  type="button"
                  onClick={() => triggerFileInput(term.id)}
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                    term.image
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  title={term.image ? 'Replace attachment image' : 'Attach image/photo'}
                >
                  <ImageIcon size={16} />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteTerm(term.id)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-red-55 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                  title="Remove term"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Attached Image Preview */}
              {term.image && (
                <div className="ml-16 relative inline-flex items-center gap-2 self-start rounded-xl border border-slate-150 bg-slate-50/80 p-1.5 pr-3">
                  <img
                    src={term.image}
                    alt={`Term ${index + 1} attachment`}
                    className="h-10 w-10 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="text-[10px] font-bold text-slate-500">
                    Image Attached
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(term.id)}
                    className="ml-2 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add Another Term dashed button */}
          <button
            type="button"
            onClick={handleAddTerm}
            className="w-full min-h-[44px] rounded-xl border border-dashed border-slate-350 bg-slate-50/50 hover:bg-slate-50 py-3 flex items-center justify-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-all cursor-pointer"
          >
            <Plus size={15} />
            Add Another Term
          </button>
        </div>
      )}
    </div>
  );
}
