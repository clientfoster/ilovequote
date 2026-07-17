import { useEffect, useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import type { InvoiceGstType } from '../../invoiceDraft';

const GST_RATES = [0, 3, 5, 12, 18, 28];
const DEFAULT_TAX_TYPES = ['NONE', 'GST (India)', 'VAT', 'PPN', 'SST', 'HST', 'TAX'];
const PLACES_OF_SUPPLY = [
  'Other Territory', 'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export type GSTSettings = {
  enabled: boolean;
  taxType: string;
  type: InvoiceGstType;
  rate: number;
  placeOfSupply: string;
  reverseCharge: boolean;
  cessEnabled: boolean;
  cessRate: number;
};

export default function GSTModal({ open, settings, onApply, onClose }: { open: boolean; settings: GSTSettings; onApply: (settings: GSTSettings) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(settings);
  const [customRate, setCustomRate] = useState(!GST_RATES.includes(settings.rate));
  const [taxMenuOpen, setTaxMenuOpen] = useState(false);
  const [creatingTax, setCreatingTax] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(settings);
    setCustomRate(!GST_RATES.includes(settings.rate));
    setTaxMenuOpen(false);
    setCreatingTax(false);
    setNewTaxName('');
  }, [open, settings]);

  if (!open) return null;
  const fieldClass = 'min-h-[42px] w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#2E6EAB] focus:ring-2 focus:ring-[#EAF4FF]';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-3" role="dialog" aria-modal="true" aria-labelledby="gst-modal-title">
      <div className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="gst-modal-title" className="text-sm font-black text-slate-900">Configure Tax</h2>
          <button type="button" onClick={onClose} aria-label="Close tax configuration" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="grid grid-cols-[20px_1fr] gap-2">
            <span className="pt-0.5 text-xs font-black text-slate-800">1.</span>
            <div className="relative">
              <span className="mb-2 block text-xs font-bold text-slate-800">Select Tax Type<span className="text-rose-500">*</span></span>
              <button type="button" onClick={() => setTaxMenuOpen((current) => !current)} className={`${fieldClass} flex items-center justify-between text-left`} aria-haspopup="listbox" aria-expanded={taxMenuOpen}>
                <span>{draft.enabled ? draft.taxType : 'NONE'}</span><ChevronDown className={`h-4 w-4 transition ${taxMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {taxMenuOpen ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                  <div className="max-h-52 overflow-y-auto py-1" role="listbox">
                    {Array.from(new Set([...DEFAULT_TAX_TYPES, draft.taxType])).filter(Boolean).map((taxType) => {
                      const selected = taxType === (draft.enabled ? draft.taxType : 'NONE');
                      return <button key={taxType} type="button" role="option" aria-selected={selected} onClick={() => { setDraft((current) => ({ ...current, enabled: taxType !== 'NONE', taxType: taxType === 'NONE' ? current.taxType : taxType })); setTaxMenuOpen(false); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs ${selected ? 'bg-[#EAF4FF] font-bold text-[#2E6EAB]' : 'text-slate-700 hover:bg-slate-50'}`}><span>{taxType}</span>{selected ? <Check className="h-3.5 w-3.5" /> : null}</button>;
                    })}
                  </div>
                  <div className="border-t border-slate-200 p-2">
                    {creatingTax ? <div className="flex gap-2"><input autoFocus value={newTaxName} onChange={(event) => setNewTaxName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && newTaxName.trim()) { event.preventDefault(); setDraft((current) => ({ ...current, enabled: true, taxType: newTaxName.trim() })); setCreatingTax(false); setTaxMenuOpen(false); setNewTaxName(''); } }} placeholder="Tax name" className="min-w-0 flex-1 rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:border-[#2E6EAB]" /><button type="button" disabled={!newTaxName.trim()} onClick={() => { setDraft((current) => ({ ...current, enabled: true, taxType: newTaxName.trim() })); setCreatingTax(false); setTaxMenuOpen(false); setNewTaxName(''); }} className="rounded-md bg-[#2E6EAB] px-3 text-xs font-bold text-white disabled:opacity-40">Add</button></div> : <button type="button" onClick={() => setCreatingTax(true)} className="w-full rounded-md py-2 text-xs font-bold text-[#2E6EAB] hover:bg-[#EAF4FF]">+ Create New Tax</button>}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className={`grid grid-cols-[20px_1fr] gap-2 ${draft.enabled ? '' : 'pointer-events-none opacity-45'}`}>
            <span className="pt-0.5 text-xs font-black text-slate-800">2.</span>
            <label><span className="mb-2 block text-xs font-bold text-slate-800">Place of Supply<span className="text-rose-500">*</span></span><select value={draft.placeOfSupply} onChange={(event) => setDraft((current) => ({ ...current, placeOfSupply: event.target.value }))} className={fieldClass}>{PLACES_OF_SUPPLY.map((place) => <option key={place}>{place}</option>)}</select></label>
          </section>

          <section className={`grid grid-cols-[20px_1fr] gap-2 ${draft.enabled ? '' : 'pointer-events-none opacity-45'}`}>
            <span className="pt-0.5 text-xs font-black text-slate-800">3.</span>
            <div><span className="mb-3 block text-xs font-bold text-slate-800">GST Type<span className="text-rose-500">*</span></span><div className="flex flex-wrap gap-x-8 gap-y-3">{([['IGST', 'IGST'], ['CGST_SGST', 'CGST & SGST']] as const).map(([value, label]) => <label key={value} className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700"><input type="radio" name="gst-type" checked={draft.type === value} onChange={() => setDraft((current) => ({ ...current, type: value }))} className="h-4 w-4 border-slate-300 text-[#2E6EAB] focus:ring-[#2E6EAB]" />{label}</label>)}</div><button type="button" onClick={() => setDraft((current) => ({ ...current, cessEnabled: !current.cessEnabled }))} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#2E6EAB]"><Plus className="h-4 w-4" />{draft.cessEnabled ? 'Remove Cess' : 'Add Cess'}</button>{draft.cessEnabled ? <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Cess Rate</span><div className="relative"><input type="number" min="0" max="100" step="0.01" value={draft.cessRate} onChange={(event) => setDraft((current) => ({ ...current, cessRate: Math.min(100, Math.max(0, Number(event.target.value) || 0)) }))} className={`${fieldClass} pr-9`} /><span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-500">%</span></div></label> : null}</div>
          </section>

          <section className={`grid grid-cols-[20px_1fr] gap-2 ${draft.enabled ? '' : 'pointer-events-none opacity-45'}`}>
            <span className="pt-0.5 text-xs font-black text-slate-800">4.</span>
            <div><span className="mb-2 block text-xs font-bold text-slate-800">GST Rate<span className="text-rose-500">*</span></span><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{GST_RATES.map((rate) => <button key={rate} type="button" onClick={() => { setCustomRate(false); setDraft((current) => ({ ...current, rate })); }} className={`rounded-md border px-2 py-2 text-xs font-bold ${!customRate && draft.rate === rate ? 'border-[#2E6EAB] bg-[#EAF4FF] text-[#2E6EAB]' : 'border-slate-200 text-slate-600'}`}>{rate}%</button>)}<button type="button" onClick={() => setCustomRate(true)} className={`rounded-md border px-2 py-2 text-xs font-bold ${customRate ? 'border-[#2E6EAB] bg-[#EAF4FF] text-[#2E6EAB]' : 'border-slate-200 text-slate-600'}`}>Custom</button></div>{customRate ? <div className="relative mt-3"><input autoFocus type="number" min="0" max="100" step="0.01" value={draft.rate} onChange={(event) => setDraft((current) => ({ ...current, rate: Math.min(100, Math.max(0, Number(event.target.value) || 0)) }))} className={`${fieldClass} pr-9`} /><span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-500">%</span></div> : null}</div>
          </section>

          <section className={`grid grid-cols-[20px_1fr] gap-2 ${draft.enabled ? '' : 'pointer-events-none opacity-45'}`}>
            <span className="pt-0.5 text-xs font-black text-slate-800">5.</span>
            <div><span className="mb-3 block text-xs font-bold text-slate-800">Other Options</span><label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={draft.reverseCharge} onChange={(event) => setDraft((current) => ({ ...current, reverseCharge: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-[#2E6EAB] focus:ring-[#2E6EAB]" />Is Reverse Charge Applicable?</label></div>
          </section>
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-5 py-3">
          <button type="button" onClick={onClose} className="px-1 py-2 text-xs font-medium text-slate-600">Cancel</button>
          <button type="button" onClick={() => onApply(draft)} className="rounded-md bg-[#2E6EAB] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#245B8F]">Save Changes</button>
        </footer>
      </div>
    </div>
  );
}
