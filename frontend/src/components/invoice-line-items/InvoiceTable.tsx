import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { DEFAULT_INVOICE_COLUMN_ORDER, makeInvoiceLineItem, type InvoiceColumnKey, type InvoiceDraft, type InvoiceLineItem } from '../../invoiceDraft';
import InvoiceRow from './InvoiceRow';
import TotalsCalculator from './TotalsCalculator';

export default function InvoiceTable({ draft, onChange }: { draft: InvoiceDraft; onChange: (patch: Partial<InvoiceDraft>) => void }) {
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const visible = useMemo(() => ({
    hsnSac: draft.lineItemColumns.hsnSac,
    gstRate: draft.showTax && draft.lineItemColumns.gstRate,
    quantity: draft.lineItemColumns.quantity,
    rate: draft.lineItemColumns.rate,
    amount: draft.lineItemColumns.amount,
    discount: draft.lineItemColumns.discount,
    cgst: draft.showTax && draft.gstType === 'CGST_SGST' && draft.lineItemColumns.cgst,
    sgst: draft.showTax && draft.gstType === 'CGST_SGST' && draft.lineItemColumns.sgst,
    igst: draft.showTax && draft.gstType === 'IGST' && draft.lineItemColumns.igst,
    total: draft.lineItemColumns.total,
  }), [draft.gstType, draft.lineItemColumns, draft.showTax]);
  const displayedOrder = useMemo(() => draft.lineItemColumnOrder.filter((key) => DEFAULT_INVOICE_COLUMN_ORDER.includes(key) ? visible[key as InvoiceColumnKey] : draft.customLineItemColumns.find((column) => column.id === key)?.visible !== false), [draft.customLineItemColumns, draft.lineItemColumnOrder, visible]);
  const columnWidths: Record<InvoiceColumnKey, string> = {
    hsnSac: '90px', gstRate: '86px', quantity: '82px', rate: '100px', amount: '105px', discount: '95px', cgst: '90px', sgst: '90px', igst: '90px', total: '110px',
  };

  const gridTemplate = useMemo(() => ['42px', 'minmax(190px,1.6fr)', ...displayedOrder.map((key) => DEFAULT_INVOICE_COLUMN_ORDER.includes(key) ? columnWidths[key as InvoiceColumnKey] : '110px'), '120px'].join(' '), [displayedOrder]);
  const columnLabel = (key: string) => DEFAULT_INVOICE_COLUMN_ORDER.includes(key) ? draft.lineItemColumnLabels[key as InvoiceColumnKey] : draft.customLineItemColumns.find((column) => column.id === key)?.label || 'Custom';

  const updateRow = (id: string, patch: Partial<InvoiceLineItem>) => onChange({ lineItems: draft.lineItems.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const insertAt = (index: number, item: InvoiceLineItem) => onChange({ lineItems: [...draft.lineItems.slice(0, index), item, ...draft.lineItems.slice(index)] });
  const duplicate = (item: InvoiceLineItem, index: number) => insertAt(index + 1, { ...item, id: makeInvoiceLineItem().id });
  const insert = (index: number) => {
    const next = makeInvoiceLineItem();
    next.tax = draft.lineItems[0]?.tax ?? 18;
    insertAt(index + 1, next);
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.lineItems.length) return;
    const lineItems = [...draft.lineItems];
    [lineItems[index], lineItems[target]] = [lineItems[target], lineItems[index]];
    onChange({ lineItems });
  };
  const remove = (id: string) => { if (draft.lineItems.length > 1) onChange({ lineItems: draft.lineItems.filter((item) => item.id !== id) }); };
  const add = () => {
    const next = makeInvoiceLineItem();
    next.tax = draft.lineItems[0]?.tax ?? 18;
    onChange({ lineItems: [...draft.lineItems, next] });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <div className="hidden min-w-[980px] items-center gap-3 bg-[#2E6EAB] px-4 py-3 text-[14px] font-semibold leading-5 tracking-normal text-white md:grid" style={{ gridTemplateColumns: gridTemplate }}>
          <span>#</span><span>Item</span>{displayedOrder.map((key) => <span key={key}>{columnLabel(key)}</span>)}<span />
        </div>
        <div className="space-y-3 bg-slate-100/60 p-3 md:min-w-[980px] md:space-y-0 md:p-0">
          {draft.lineItems.map((item, index) => <InvoiceRow key={item.id} index={index} item={item} currency={draft.currency} gstEnabled={draft.showTax} gstType={draft.gstType} columns={draft.lineItemColumns} columnOrder={draft.lineItemColumnOrder} customColumns={draft.customLineItemColumns} labels={draft.lineItemColumnLabels} formulas={draft.lineItemFormulas} desktop={desktop} gridTemplate={gridTemplate} canDelete={draft.lineItems.length > 1} canMoveUp={index > 0} canMoveDown={index < draft.lineItems.length - 1} onChange={(patch) => updateRow(item.id, patch)} onMoveUp={() => move(index, -1)} onMoveDown={() => move(index, 1)} onInsert={() => insert(index)} onDuplicate={() => duplicate(item, index)} onDelete={() => remove(item.id)} />)}
        </div>
      </div>
      <div className="border-t border-slate-200 p-4"><button type="button" onClick={add} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#B7D4F0] bg-white px-4 text-[14px] font-medium leading-5 text-slate-600 transition hover:bg-[#EAF4FF] hover:text-[#2E6EAB]"><Plus className="h-4 w-4" />Add New Line</button><TotalsCalculator draft={draft} onChange={onChange} /></div>
    </section>
  );
}
