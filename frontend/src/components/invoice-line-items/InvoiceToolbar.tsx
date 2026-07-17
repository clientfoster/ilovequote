import { useState } from 'react';
import { Columns3, Percent } from 'lucide-react';
import type { InvoiceColumnId, InvoiceColumnLabels, InvoiceCustomColumn, InvoiceFormulaConfig, InvoiceLineItemColumns } from '../../invoiceDraft';
import ColumnEditorModal from './ColumnEditorModal';
import CurrencySelector from './CurrencySelector';
import GSTModal, { type GSTSettings } from './GSTModal';

export default function InvoiceToolbar({
  currency,
  gstSettings,
  columns,
  columnOrder,
  customColumns,
  labels,
  formulas,
  onCurrencyChange,
  onGSTApply,
  onColumnsApply,
}: {
  currency: string;
  gstSettings: GSTSettings;
  columns: InvoiceLineItemColumns;
  columnOrder: InvoiceColumnId[];
  customColumns: InvoiceCustomColumn[];
  labels: InvoiceColumnLabels;
  formulas: InvoiceFormulaConfig;
  onCurrencyChange: (currency: string) => void;
  onGSTApply: (settings: GSTSettings) => void;
  onColumnsApply: (columns: InvoiceLineItemColumns, order: InvoiceColumnId[], customColumns: InvoiceCustomColumn[], labels: InvoiceColumnLabels, formulas: InvoiceFormulaConfig) => void;
}) {
  const [gstOpen, setGstOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3 md:items-end">
        <button type="button" onClick={() => setGstOpen(true)} className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-800 shadow-sm transition hover:border-[#B7D4F0] hover:text-[#2E6EAB]"><Percent className="h-5 w-5 text-[#2E6EAB]" />Edit GST</button>
        <CurrencySelector value={currency} onChange={onCurrencyChange} />
        <button type="button" onClick={() => setColumnsOpen(true)} className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-800 shadow-sm transition hover:border-[#B7D4F0] hover:text-[#2E6EAB]"><Columns3 className="h-5 w-5 text-[#2E6EAB]" />Edit Columns/Formulas</button>
      </div>
      <GSTModal open={gstOpen} settings={gstSettings} onClose={() => setGstOpen(false)} onApply={(settings) => { onGSTApply(settings); setGstOpen(false); }} />
      <ColumnEditorModal open={columnsOpen} gstType={gstSettings.type} columns={columns} columnOrder={columnOrder} customColumns={customColumns} labels={labels} formulas={formulas} onOrderChange={(nextOrder, nextCustomColumns) => onColumnsApply(columns, nextOrder, nextCustomColumns, labels, formulas)} onClose={() => setColumnsOpen(false)} onApply={(nextColumns, nextOrder, nextCustomColumns, nextLabels, nextFormulas) => { onColumnsApply(nextColumns, nextOrder, nextCustomColumns, nextLabels, nextFormulas); setColumnsOpen(false); }} />
    </>
  );
}
