import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { TaxConfiguration, INDIAN_STATES_AND_UTS } from '../../types/structuredQuote';

interface TaxConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxConfig: TaxConfiguration;
  onSave: (config: TaxConfiguration) => void;
}

export default function TaxConfigModal({
  isOpen,
  onClose,
  taxConfig,
  onSave,
}: TaxConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<TaxConfiguration>({ ...taxConfig });

  useEffect(() => {
    if (isOpen) {
      setLocalConfig({ ...taxConfig });
    }
  }, [isOpen, taxConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Configure Tax</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* 1. Select Tax Type */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-1.5">
              1. Select Tax Type<span className="text-red-500">*</span>
            </label>
            <select
              value={localConfig.taxType}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  taxType: e.target.value as TaxConfiguration['taxType'],
                }))
              }
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all cursor-pointer"
            >
              <option value="GST (India)">GST (India)</option>
              <option value="VAT">VAT</option>
              <option value="Sales Tax">Sales Tax</option>
              <option value="None">None</option>
            </select>
          </div>

          {/* 2. Place of Supply */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-1.5">
              2. Place of Supply<span className="text-red-500">*</span>
            </label>
            <select
              value={localConfig.placeOfSupply}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  placeOfSupply: e.target.value,
                }))
              }
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-purple-500 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all cursor-pointer"
            >
              {INDIAN_STATES_AND_UTS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* 3. GST Type */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
              3. GST Type<span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-800">
                <input
                  type="radio"
                  name="gstType"
                  value="IGST"
                  checked={localConfig.gstType === 'IGST'}
                  onChange={() => setLocalConfig((prev) => ({ ...prev, gstType: 'IGST' }))}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 accent-purple-600"
                />
                <span>IGST</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-800">
                <input
                  type="radio"
                  name="gstType"
                  value="CGST & SGST"
                  checked={localConfig.gstType === 'CGST & SGST'}
                  onChange={() => setLocalConfig((prev) => ({ ...prev, gstType: 'CGST & SGST' }))}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 accent-purple-600"
                />
                <span>CGST &amp; SGST</span>
              </label>
            </div>

            {/* Add Cess */}
            <div className="mt-3">
              {!localConfig.hasCess ? (
                <button
                  type="button"
                  onClick={() => setLocalConfig((prev) => ({ ...prev, hasCess: true, cessPercent: prev.cessPercent || 1 }))}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Cess</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 mt-2 p-2.5 bg-purple-50/60 rounded-xl border border-purple-200">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      Cess Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={localConfig.cessPercent}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          cessPercent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full text-xs sm:text-sm px-3 py-1.5 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocalConfig((prev) => ({ ...prev, hasCess: false, cessPercent: 0 }))}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                    title="Remove Cess"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. Other Options */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
              4. Other Options
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-gray-800 font-medium">
              <input
                type="checkbox"
                checked={localConfig.isReverseCharge}
                onChange={(e) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    isReverseCharge: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
              />
              <span>Is Reverse Charge Applicable?</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
