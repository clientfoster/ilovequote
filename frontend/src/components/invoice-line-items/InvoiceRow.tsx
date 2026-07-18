import type { Key, ReactNode } from 'react';
import { ArrowDown, ArrowUp, Copy, ListPlus, X } from 'lucide-react';
import { calculateInvoiceLine, formatInvoiceCurrency, type InvoiceColumnId, type InvoiceColumnKey, type InvoiceColumnLabels, type InvoiceColumnTypes, type InvoiceCustomColumn, type InvoiceFormulaConfig, type InvoiceGstType, type InvoiceLineItem, type InvoiceLineItemColumns } from '../../invoiceDraft';
import DescriptionEditor from './DescriptionEditor';

function Cell({ label, children, className = '' }: { label: string; children: ReactNode; className?: string; key?: Key }) {
  return <div className={`mb-3 min-w-0 self-start last:mb-0 md:mb-0 ${className}`}><span className="mb-1 block text-[14px] font-medium leading-5 text-slate-500 md:hidden">{label}</span>{children}</div>;
}

const inputClass = 'h-10 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[14px] font-normal leading-5 text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2E6EAB] focus:ring-2 focus:ring-[#EAF4FF] md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-1 md:focus:ring-0';

export default function InvoiceRow({ index, item, currency, gstEnabled, gstType, columns, columnOrder, columnTypes, customColumns, labels, formulas, desktop, gridTemplate, canDelete, canMoveUp, canMoveDown, onChange, onMoveUp, onMoveDown, onInsert, onDuplicate, onDelete }: {
  index: number;
  item: InvoiceLineItem;
  currency: string;
  gstEnabled: boolean;
  gstType: InvoiceGstType;
  columns: InvoiceLineItemColumns;
  columnOrder: InvoiceColumnId[];
  columnTypes: InvoiceColumnTypes;
  customColumns: InvoiceCustomColumn[];
  labels: InvoiceColumnLabels;
  formulas: InvoiceFormulaConfig;
  desktop: boolean;
  gridTemplate: string;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (patch: Partial<InvoiceLineItem>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsert: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  key?: Key;
}) {
  const calculated = calculateInvoiceLine(item, formulas, gstType, gstEnabled, columnTypes);
  const money = (value: number) => formatInvoiceCurrency(value, currency);
  const renderColumn = (key: InvoiceColumnId) => {
    const custom = customColumns.find((column) => column.id === key);
    if (custom) {
      if (!custom.visible) return null;
      const value = item.customValues?.[key] ?? '';
      return <Cell key={key} label={custom.label}><input aria-label={`Item ${index + 1} ${custom.label}`} type={custom.type === 'TEXT' ? 'text' : 'number'} min={custom.type === 'TEXT' ? undefined : 0} step={custom.type === 'TEXT' ? undefined : '0.01'} value={value} onChange={(event) => onChange({ customValues: { ...(item.customValues || {}), [key]: custom.type === 'TEXT' ? event.target.value : Math.max(0, Number(event.target.value) || 0) } })} className={inputClass} /></Cell>;
    }
    const builtInKey = key as InvoiceColumnKey;
    if (!columns[builtInKey]) return null;
    switch (builtInKey) {
      case 'hsnSac': return <Cell key={key} label={labels.hsnSac}><input aria-label={`Item ${index + 1} HSN or SAC`} value={item.hsnSac || ''} onChange={(event) => onChange({ hsnSac: event.target.value })} placeholder={labels.hsnSac} className={inputClass} /></Cell>;
      case 'gstRate': return gstEnabled ? <Cell key={key} label={labels.gstRate}>{columnTypes.gstRate === 'FORMULA' ? <output className="block min-h-[40px] pt-2.5 text-[14px] font-medium tabular-nums">{calculated.gstRate}%</output> : <div className="relative"><input aria-label={`Item ${index + 1} tax rate`} type="number" inputMode="decimal" min="0" max="100" step="0.01" value={item.tax} onChange={(event) => onChange({ tax: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} className={`${inputClass} invoice-tax-rate-input pr-8 tabular-nums`} /><span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[14px] font-medium text-slate-600">%</span></div>}</Cell> : null;
      case 'quantity': return <Cell key={key} label={labels.quantity}>{columnTypes.quantity === 'FORMULA' ? <output className="block min-h-[40px] pt-2.5 text-[14px] tabular-nums">{calculated.quantity}</output> : <input aria-label={`Item ${index + 1} quantity`} type="number" min="1" step="1" value={item.quantity} onChange={(event) => onChange({ quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)) })} className={inputClass} />}</Cell>;
      case 'rate': return <Cell key={key} label={labels.rate}>{columnTypes.rate === 'FORMULA' ? <output className="block min-h-[40px] pt-2.5 text-[14px] font-medium tabular-nums">{money(calculated.rate)}</output> : <input aria-label={`Item ${index + 1} rate`} type="number" min="0" step="0.01" value={item.rate || ''} onChange={(event) => onChange({ rate: Math.max(0, Number(event.target.value) || 0) })} placeholder="0.00" className={inputClass} />}</Cell>;
      case 'amount': return <Cell key={key} label={labels.amount}><output className="block min-h-[40px] pt-2.5 text-[14px] font-medium leading-5 tabular-nums text-slate-900">{money(calculated.amount)}</output></Cell>;
      case 'discount': return <Cell key={key} label={labels.discount}>{columnTypes.discount === 'FORMULA' ? <output className="block min-h-[40px] pt-2.5 text-[14px] font-medium tabular-nums">{money(calculated.discount)}</output> : <input aria-label={`Item ${index + 1} discount`} type="number" min="0" step="0.01" value={item.discount || ''} onChange={(event) => onChange({ discount: Math.max(0, Number(event.target.value) || 0) })} placeholder="0.00" className={inputClass} />}</Cell>;
      case 'cgst': return gstEnabled && gstType === 'CGST_SGST' ? <Cell key={key} label={labels.cgst}><output className="block min-h-[40px] pt-2.5 text-[14px] font-normal leading-5 tabular-nums text-slate-700">{money(calculated.cgst)}</output></Cell> : null;
      case 'sgst': return gstEnabled && gstType === 'CGST_SGST' ? <Cell key={key} label={labels.sgst}><output className="block min-h-[40px] pt-2.5 text-[14px] font-normal leading-5 tabular-nums text-slate-700">{money(calculated.sgst)}</output></Cell> : null;
      case 'igst': return gstEnabled && gstType === 'IGST' ? <Cell key={key} label={labels.igst}><output className="block min-h-[40px] pt-2.5 text-[14px] font-normal leading-5 tabular-nums text-slate-700">{money(calculated.igst)}</output></Cell> : null;
      case 'total': return <Cell key={key} label={labels.total}><output className="block min-h-[40px] pt-2.5 text-[14px] font-bold leading-5 tabular-nums text-slate-900">{money(calculated.total)}</output></Cell>;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 md:grid md:min-w-[980px] md:items-start md:gap-3 md:rounded-none md:border-x-0 md:border-b-0 md:border-t md:bg-slate-50/40 md:shadow-none" style={desktop ? { gridTemplateColumns: gridTemplate } : undefined}>
      <div className="mb-3 text-[14px] font-semibold leading-5 text-slate-900 md:mb-0">{index + 1}.</div>
      <Cell label="Item">
        <div className="space-y-2">
          <div className="relative">
            <input aria-label={`Item ${index + 1} name`} value={item.name} onChange={(event) => onChange({ name: event.target.value })} placeholder="Item Name" className={`${inputClass} pr-8`} />
            <button type="button" disabled={!item.name} onClick={() => onChange({ name: '' })} aria-label={`Clear item ${index + 1} name`} title="Clear item name" className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-slate-400 transition hover:text-slate-700 disabled:opacity-50"><X className="h-3.5 w-3.5" /></button>
          </div>
          <DescriptionEditor value={item.description} onChange={(description) => onChange({ description })} />
        </div>
      </Cell>
      {columnOrder.map(renderColumn)}
      <Cell label="Actions" className="mt-3 md:mt-0">
        <div className="flex flex-wrap gap-0.5 md:justify-end">
          <button type="button" disabled={!canMoveUp} onClick={onMoveUp} className="rounded-md p-1.5 text-slate-400 hover:bg-[#EAF4FF] hover:text-[#2E6EAB] disabled:cursor-not-allowed disabled:opacity-25" aria-label={`Move item ${index + 1} up`}><ArrowUp className="h-3.5 w-3.5" /></button>
          <button type="button" disabled={!canMoveDown} onClick={onMoveDown} className="rounded-md p-1.5 text-slate-400 hover:bg-[#EAF4FF] hover:text-[#2E6EAB] disabled:cursor-not-allowed disabled:opacity-25" aria-label={`Move item ${index + 1} down`}><ArrowDown className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onInsert} className="rounded-md p-1.5 text-slate-400 hover:bg-[#EAF4FF] hover:text-[#2E6EAB]" aria-label={`Insert item after ${index + 1}`}><ListPlus className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onDuplicate} className="rounded-md p-1.5 text-slate-400 hover:bg-[#EAF4FF] hover:text-[#2E6EAB]" aria-label={`Duplicate item ${index + 1}`}><Copy className="h-3.5 w-3.5" /></button>
          <button type="button" disabled={!canDelete} onClick={onDelete} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-25" aria-label={canDelete ? `Delete item ${index + 1}` : 'At least one line item is required'}><X className="h-3.5 w-3.5" /></button>
        </div>
      </Cell>
    </div>
  );
}
