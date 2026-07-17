import { useState } from 'react';
import { CirclePlus, X } from 'lucide-react';

export default function DescriptionEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [expanded, setExpanded] = useState(Boolean(value));
  if (!expanded) return <button type="button" onClick={() => setExpanded(true)} className="inline-flex h-10 items-center gap-1 text-[14px] font-medium leading-5 text-[#2E6EAB]"><CirclePlus className="h-4 w-4" />Add Description</button>;
  return <div className="relative"><textarea autoFocus={!value} value={value} onChange={(event) => onChange(event.target.value)} rows={2} placeholder="Item description" className="w-full resize-y rounded-md border border-slate-200 bg-white px-2.5 py-2 pr-8 text-[14px] font-normal leading-5 text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2E6EAB]" /><button type="button" onClick={() => { onChange(''); setExpanded(false); }} aria-label="Remove description" className="absolute right-1.5 top-1.5 rounded p-1 text-slate-400 hover:text-rose-500"><X className="h-3.5 w-3.5" /></button></div>;
}
