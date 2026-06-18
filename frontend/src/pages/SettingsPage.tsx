import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, RotateCcw, AlertCircle, Sparkles, Building, Settings as SettingsIcon, FileText, Palette, Percent } from 'lucide-react';
import { AppSettings, BusinessFormValues } from '../types';

const SETTINGS_STORAGE_KEY = 'ilovequote_app_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultGstPercent: 18,
  defaultTerms: "1. Please pay within 15 days of invoice date.\n2. Goods once sold cannot be returned.\n3. Thank you for your business!",
  businessDefaults: {
    companyName: 'Semixon Creative Agency',
    tagline: 'Elevating digital experiences with modern design.',
    email: 'hello@semixon.com',
    phone: '+1 (555) 019-2834',
    website: 'https://semixon.com',
    address: '100 Silicon Boulevard, Suite 400',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94107',
    country: 'United States',
    businessSlug: 'semixon'
  },
  themePreference: 'Light'
};

interface SettingsPageProps {
  onTriggerToast?: (message: string) => void;
}

export default function SettingsPage({ onTriggerToast: propTriggerToast }: SettingsPageProps) {
  const context = useOutletContext<{ onTriggerToast: (msg: string) => void }>();
  const onTriggerToast = propTriggerToast || context?.onTriggerToast || (() => {});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      onTriggerToast('Settings Saved Successfully');
    } catch (err) {
      onTriggerToast('Error saving settings');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      onTriggerToast('Settings reset to system defaults');
    }
  };

  const updateBusinessDefault = (key: keyof BusinessFormValues, value: any) => {
    setSettings(prev => ({
      ...prev,
      businessDefaults: {
        ...prev.businessDefaults,
        [key]: value
      }
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 md:p-8" id="settings-page-wrapper">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* UPPER TITLE ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-[#1D4ED8]" />
              Application Settings
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Configure global presets, taxes, and profile pre-fills.</p>
          </div>
          
          <div className="flex gap-2.5">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-blue-100 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* LEFT PANELS: General and Taxes */}
          <div className="md:col-span-2 space-y-6">
            
            {/* 1. TAX & QUOTE PRESETS */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Percent className="w-4 h-4 text-[#1D4ED8]" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tax & Invoice Presets</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Default GST Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.defaultGstPercent}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultGstPercent: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all outline-hidden focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-50"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Applied automatically to item subtotals.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Theme Preference
                  </label>
                  <select
                    value={settings.themePreference}
                    onChange={(e) => setSettings(prev => ({ ...prev, themePreference: e.target.value as any }))}
                    className="w-full bg-white hover:bg-slate-50/30 focus:bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all outline-hidden focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-50 cursor-pointer"
                  >
                    <option value="Light">Light Classic (Default)</option>
                    <option value="Blue">Ocean Blue</option>
                    <option value="Slate">Slate Grey</option>
                    <option value="Dark">Charcoal Dark</option>
                  </select>
                  <span className="text-[10px] text-slate-400 font-medium">Applies visual styling defaults.</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-extrabold text-[#1D4ED8] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Default Terms & Conditions
                </label>
                <textarea
                  rows={4}
                  value={settings.defaultTerms}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultTerms: e.target.value }))}
                  className="w-full bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium transition-all outline-hidden focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-50 leading-relaxed font-mono"
                  placeholder="Terms and payment conditions..."
                />
                <span className="text-[10px] text-slate-400 font-medium">Appears as notes at the footer of quotation sheets.</span>
              </div>
            </div>

            {/* 2. BUSINESS PROFILE DEFAULT PRE-FILLS */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building className="w-4 h-4 text-[#1D4ED8]" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Business Default Fields</h3>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-normal">
                These fields pre-populate automatically when you start building a new quote, eliminating repetitive manual field setups.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Company Name</label>
                  <input
                    type="text"
                    value={settings.businessDefaults.companyName || ''}
                    onChange={(e) => updateBusinessDefault('companyName', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Tagline / Mission</label>
                  <input
                    type="text"
                    value={settings.businessDefaults.tagline || ''}
                    onChange={(e) => updateBusinessDefault('tagline', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Email Address</label>
                  <input
                    type="email"
                    value={settings.businessDefaults.email || ''}
                    onChange={(e) => updateBusinessDefault('email', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Phone</label>
                  <input
                    type="text"
                    value={settings.businessDefaults.phone || ''}
                    onChange={(e) => updateBusinessDefault('phone', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Website URL</label>
                  <input
                    type="text"
                    value={settings.businessDefaults.website || ''}
                    onChange={(e) => updateBusinessDefault('website', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Street Address</label>
                  <input
                    type="text"
                    value={settings.businessDefaults.address || ''}
                    onChange={(e) => updateBusinessDefault('address', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">City</label>
                  <input
                    type="text"
                    value={settings.businessDefaults.city || ''}
                    onChange={(e) => updateBusinessDefault('city', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">State / Region</label>
                  <input
                    type="text"
                    value={settings.businessDefaults.state || ''}
                    onChange={(e) => updateBusinessDefault('state', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#1D4ED8]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Summary and Interactive Themes Card */}
          <div className="md:col-span-1 space-y-6">
            
            {/* THEME CARD DISPLAY */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <Palette className="w-4 h-4 text-[#1D4ED8]" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Skin Theme</h3>
              </div>
              
              <div className="flex flex-col gap-2">
                {[
                  { name: 'Light', desc: 'Default Soft Slate Canvas', color: 'bg-white border-slate-200 text-slate-800' },
                  { name: 'Blue', desc: 'Ocean Indigo Corporate Accent', color: 'bg-blue-50 border-blue-200 text-slate-900' },
                  { name: 'Slate', desc: 'Minimal Professional Slate Gray', color: 'bg-slate-100 border-slate-200 text-slate-800' },
                  { name: 'Dark', desc: 'Premium Eye-Safe Dark Space', color: 'bg-slate-900 border-slate-750 text-slate-100' },
                ].map((t) => {
                  const isSel = settings.themePreference === t.name;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, themePreference: t.name as any }))}
                      className={`w-full p-3.5 text-left border rounded-xl flex items-center transition-all cursor-pointer ${t.color} ${
                        isSel ? 'ring-2 ring-blue-500 border-blue-500 scale-[1.02] shadow-xs' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold">{t.name}</h4>
                        <p className="text-[10px] opacity-80 mt-0.5 leading-normal font-medium">{t.desc}</p>
                      </div>
                      {isSel && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIP CARD */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#1D4ED8]" />
                <h4 className="text-xs font-extrabold text-slate-900">Why configure presets?</h4>
              </div>
              <p className="text-[11px] text-slate-505 leading-relaxed font-medium">
                Setting defaults ensures faster quotation generations. Every client you onboard and line item you add is dynamically adjusted based on these preconfigured percentages.
              </p>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}
