import React, { useEffect, useRef, useState } from 'react';

export interface SearchableProfileOption<TPatch = Record<string, unknown>> {
  id: string;
  label: string;
  patch: TPatch;
}

interface SearchableProfileSelectProps<TPatch = Record<string, unknown>> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<SearchableProfileOption<TPatch>>;
  placeholder: string;
  emptyMessage: string;
}

export default function SearchableProfileSelect<TPatch = Record<string, unknown>>({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyMessage,
}: SearchableProfileSelectProps<TPatch>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const selected = options.find((option) => option.id === value);
    setQuery(selected?.label || '');
  }, [options, value]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    !query.trim() || option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div ref={containerRef} className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
          <input
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              const nextValue = event.target.value;
              setQuery(nextValue);
              setIsOpen(true);
              if (!nextValue.trim()) {
                onChange('manual');
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setQuery(option.label);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm font-medium text-slate-500">{emptyMessage}</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
