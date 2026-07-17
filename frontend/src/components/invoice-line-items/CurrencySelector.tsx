import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

export const COMMON_CURRENCIES: CurrencyOption[] = [
  { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
  { code: 'ALL', symbol: 'L', name: 'Albanian Lek' },
  { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial' },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
];

function resolveCurrency(value: string) {
  const normalized = value.toUpperCase();
  return COMMON_CURRENCIES.find((currency) => normalized.includes(currency.code)) || COMMON_CURRENCIES[0];
}

export default function CurrencySelector({ value, onChange }: { value: string; onChange: (currencyCode: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = resolveCurrency(value);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search
      ? COMMON_CURRENCIES.filter((currency) => `${currency.code} ${currency.name} ${currency.symbol}`.toLowerCase().includes(search))
      : COMMON_CURRENCIES;
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const choose = (currency: CurrencyOption) => {
    onChange(currency.code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-semibold text-slate-800">Currency<span className="text-rose-500">*</span></label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-[58px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left shadow-sm outline-none transition focus:border-[#2E6EAB] focus:ring-2 focus:ring-[#EAF4FF]"
      >
        <span className="min-w-0"><span className="font-bold text-slate-900">{selected.code}</span><span className="ml-2 truncate text-sm text-slate-500">{selected.name} ({selected.symbol})</span></span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-[75] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(filtered.length - 1, index + 1)); }
                if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(0, index - 1)); }
                if (event.key === 'Enter' && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex]); }
                if (event.key === 'Escape') setOpen(false);
              }}
              placeholder="Search currency"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {filtered.map((currency, index) => (
              <button key={currency.code} type="button" role="option" aria-selected={selected.code === currency.code} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(currency)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${index === activeIndex ? 'bg-[#EAF4FF]' : 'hover:bg-slate-50'}`}>
                <span className="w-8 text-center text-sm font-bold text-[#2E6EAB]">{currency.symbol}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{currency.code}</span><span className="block truncate text-xs text-slate-500">{currency.name}</span></span>
                {selected.code === currency.code ? <Check className="h-4 w-4 text-[#2E6EAB]" /> : null}
              </button>
            ))}
            {filtered.length === 0 ? <p className="px-3 py-6 text-center text-sm text-slate-500">No currencies found.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
