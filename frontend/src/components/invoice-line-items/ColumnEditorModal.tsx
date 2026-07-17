import { useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Lightbulb, LockKeyhole, RotateCcw, X } from 'lucide-react';
import { DEFAULT_INVOICE_COLUMN_ORDER, type InvoiceColumnId, type InvoiceColumnKey, type InvoiceColumnLabels, type InvoiceCustomColumn, type InvoiceFormulaConfig, type InvoiceGstType, type InvoiceLineItemColumns } from '../../invoiceDraft';

const DEFAULT_FORMULAS: InvoiceFormulaConfig = {
  amount: 'D1 * E1', tax: 'F1 * C1 / 100', cgst: 'F1 * C1 / 200', sgst: 'F1 * C1 / 200', igst: 'F1 * C1 / 100', total: 'F1 + G1 + H1',
};

const DEFAULT_LABELS: InvoiceColumnLabels = {
  hsnSac: 'HSN/SAC', gstRate: 'GST Rate', quantity: 'Quantity', rate: 'Rate', amount: 'Amount', discount: 'Discount', cgst: 'CGST', sgst: 'SGST', igst: 'IGST', total: 'Total',
};

type ColumnDefinition = {
  key: InvoiceColumnId;
  cell: string;
  type: 'TEXT' | 'NUMBER' | 'CURRENCY' | 'FORMULA';
  formulaKey?: keyof InvoiceFormulaConfig;
  description?: string;
};

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { key: 'hsnSac', cell: 'B1', type: 'TEXT' },
  { key: 'gstRate', cell: 'C1', type: 'NUMBER' },
  { key: 'quantity', cell: 'D1', type: 'NUMBER' },
  { key: 'rate', cell: 'E1', type: 'CURRENCY' },
  { key: 'amount', cell: 'F1', type: 'FORMULA', formulaKey: 'amount', description: 'Quantity × Rate' },
  { key: 'discount', cell: 'J1', type: 'CURRENCY' },
  { key: 'cgst', cell: 'G1', type: 'FORMULA', formulaKey: 'cgst', description: 'Amount × (GST Rate / 2) / 100' },
  { key: 'sgst', cell: 'H1', type: 'FORMULA', formulaKey: 'sgst', description: 'Amount × (GST Rate / 2) / 100' },
  { key: 'igst', cell: 'G1', type: 'FORMULA', formulaKey: 'igst', description: 'Amount × GST Rate / 100' },
  { key: 'total', cell: 'I1', type: 'FORMULA', formulaKey: 'total', description: 'Amount + Tax' },
];

type RowProps = {
  key?: Key;
  column: ColumnDefinition;
  label: string;
  visible: boolean;
  formulaValue?: string;
  formulaDescription?: string;
  onLabelChange: (value: string) => void;
  onVisibilityChange: () => void;
  locked?: boolean;
  dragHandleProps?: Record<string, unknown>;
  dragHandleRef?: (node: HTMLElement | null) => void;
  isDragging?: boolean;
  isOver?: boolean;
};

function ColumnRow({ column, label, visible, formulaValue, formulaDescription, onLabelChange, onVisibilityChange, locked = false, dragHandleProps, dragHandleRef, isDragging = false, isOver = false }: RowProps) {
  const computed = column.type === 'FORMULA';
  return (
    <div className={`grid grid-cols-[22px_34px_minmax(0,1fr)_38px] gap-x-2 border-b py-3 transition-[transform,box-shadow,background-color,opacity] duration-200 sm:grid-cols-[22px_34px_minmax(150px,1fr)_minmax(130px,0.8fr)_38px] sm:items-start ${isDragging ? 'border-[#7FAFD8] bg-[#EAF4FF] opacity-35' : isOver ? 'border-[#2E6EAB] bg-[#EAF4FF] shadow-[inset_0_2px_0_#2E6EAB]' : 'border-slate-100 bg-white'}`}>
      {locked ? <LockKeyhole className="mt-2.5 h-3.5 w-3.5 text-slate-300" aria-label={`${label} position locked`} /> : <button ref={dragHandleRef} type="button" {...dragHandleProps} className="mt-1.5 touch-none rounded p-1 text-slate-400 hover:bg-[#EAF4FF] hover:text-[#2E6EAB] active:cursor-grabbing" aria-label={`Drag ${label} column`}><GripVertical className="h-4 w-4 cursor-grab" /></button>}
      <span className="mt-2.5 text-xs font-semibold text-slate-600">{column.cell}</span>
      <input value={label} onChange={(event) => onLabelChange(event.target.value)} aria-label={`${label} column name`} className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#2E6EAB]" />
      {computed ? <div className="col-start-3 mt-2 sm:col-start-4 sm:mt-0"><div className="text-[11px] font-semibold text-slate-600">FORMULA</div><div className="mt-1 text-[10px] leading-4 text-slate-500">({formulaDescription || column.description})</div></div> : <select defaultValue={column.type} aria-label={`${label} column type`} className="col-start-3 mt-2 min-h-[38px] rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 outline-none sm:col-start-4 sm:mt-0"><option>{column.type}</option><option>TEXT</option><option>NUMBER</option><option>CURRENCY</option></select>}
      <button type="button" onClick={onVisibilityChange} aria-label={`${visible ? 'Hide' : 'Show'} ${label} column`} className="col-start-4 row-start-1 mt-1.5 rounded-lg p-2 text-slate-400 hover:bg-[#EAF4FF] hover:text-[#2E6EAB] sm:col-start-5">{visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
      {computed && formulaValue ? <div className="relative col-start-3 mt-2 sm:col-span-2 sm:col-start-3"><span className="absolute inset-y-0 left-0 flex w-9 items-center justify-center rounded-l-md border-r border-slate-200 bg-slate-50 text-[12px] italic text-slate-500">fx</span><input readOnly value={`=${formulaValue}`} aria-label={`${label} formula`} className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-11 pr-3 text-[14px] font-normal leading-5 text-slate-700 outline-none" /></div> : null}
    </div>
  );
}

function SortableColumnRow(props: RowProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: props.column.key });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}><ColumnRow {...props} dragHandleRef={setActivatorNodeRef} dragHandleProps={{ ...attributes, ...listeners }} isDragging={isDragging} isOver={isOver} /></div>;
}

function normalizeOrder(order: InvoiceColumnId[]) {
  return [...order.filter((key) => key !== 'total'), 'total'];
}

function isBuiltInKey(key: InvoiceColumnId): key is InvoiceColumnKey {
  return DEFAULT_INVOICE_COLUMN_ORDER.includes(key);
}

export default function ColumnEditorModal({ open, gstType, columns, columnOrder, customColumns, labels, formulas, onOrderChange, onApply, onClose }: {
  open: boolean;
  gstType: InvoiceGstType;
  columns: InvoiceLineItemColumns;
  columnOrder: InvoiceColumnId[];
  customColumns: InvoiceCustomColumn[];
  labels: InvoiceColumnLabels;
  formulas: InvoiceFormulaConfig;
  onOrderChange: (order: InvoiceColumnId[], customColumns: InvoiceCustomColumn[]) => void;
  onApply: (columns: InvoiceLineItemColumns, order: InvoiceColumnId[], customColumns: InvoiceCustomColumn[], labels: InvoiceColumnLabels, formulas: InvoiceFormulaConfig) => void;
  onClose: () => void;
}) {
  const [nextColumns, setNextColumns] = useState(columns);
  const [nextOrder, setNextOrder] = useState(() => normalizeOrder(columnOrder));
  const [nextCustomColumns, setNextCustomColumns] = useState(customColumns);
  const [nextLabels, setNextLabels] = useState(labels);
  const [nextFormulas, setNextFormulas] = useState(formulas);
  const [activeId, setActiveId] = useState<InvoiceColumnId | null>(null);
  const [overId, setOverId] = useState<InvoiceColumnId | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<InvoiceCustomColumn['type']>('TEXT');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    if (!open) return;
    setNextColumns(columns);
    setNextOrder(normalizeOrder(columnOrder));
    setNextCustomColumns(customColumns);
    setNextLabels(labels);
    setNextFormulas(formulas);
  }, [columnOrder, columns, customColumns, formulas, labels, open]);

  const definitions = useMemo(() => {
    const all = [...COLUMN_DEFINITIONS, ...nextCustomColumns.map((column) => ({ key: column.id, cell: '', type: column.type } satisfies ColumnDefinition))];
    return nextOrder.map((key) => all.find((column) => column.key === key)).filter((column): column is ColumnDefinition => Boolean(column)).filter((column) => column.key !== (gstType === 'IGST' ? 'cgst' : 'igst') && column.key !== (gstType === 'IGST' ? 'sgst' : 'igst'));
  }, [gstType, nextCustomColumns, nextOrder]);
  const movableDefinitions = definitions.filter((column) => column.key !== 'total');
  const totalDefinition = definitions.find((column) => column.key === 'total');
  const getCustomColumn = (key: InvoiceColumnId) => nextCustomColumns.find((column) => column.id === key);
  const getLabel = (key: InvoiceColumnId) => isBuiltInKey(key) ? nextLabels[key] : getCustomColumn(key)?.label || 'Custom';
  const getVisible = (key: InvoiceColumnId) => isBuiltInKey(key) ? nextColumns[key] : getCustomColumn(key)?.visible !== false;
  const previewColumns = definitions.filter((column) => getVisible(column.key));
  const activeDefinition = definitions.find((column) => column.key === activeId);

  if (!open) return null;

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));
  const onDragOver = ({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id || active.id === 'total' || over.id === 'total') return;
    const oldIndex = nextOrder.indexOf(String(active.id));
    const newIndex = nextOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = normalizeOrder(arrayMove(nextOrder, oldIndex, newIndex));
    setNextOrder(reordered);
    onOrderChange(reordered, nextCustomColumns);
  };

  const reset = () => {
    const order = [...DEFAULT_INVOICE_COLUMN_ORDER];
    const resetColumns = { hsnSac: true, gstRate: true, quantity: true, rate: true, amount: true, discount: false, cgst: true, sgst: true, igst: true, total: true };
    setNextColumns(resetColumns);
    setNextOrder(order);
    setNextCustomColumns([]);
    setNextLabels(DEFAULT_LABELS);
    setNextFormulas(DEFAULT_FORMULAS);
    onOrderChange(order, []);
  };

  const rowProps = (column: ColumnDefinition): RowProps => ({
    column,
    label: getLabel(column.key),
    visible: getVisible(column.key),
    formulaValue: column.formulaKey ? nextFormulas[column.formulaKey] : undefined,
    formulaDescription: column.key === 'igst' ? `Amount × ${nextLabels.gstRate} / 100` : column.key === 'cgst' || column.key === 'sgst' ? `Amount × (${nextLabels.gstRate} / 2) / 100` : column.description,
    onLabelChange: (value) => {
      if (isBuiltInKey(column.key)) setNextLabels((current) => ({ ...current, [column.key]: value }));
      else setNextCustomColumns((current) => current.map((custom) => custom.id === column.key ? { ...custom, label: value } : custom));
    },
    onVisibilityChange: () => {
      if (isBuiltInKey(column.key)) setNextColumns((current) => ({ ...current, [column.key]: !current[column.key] }));
      else setNextCustomColumns((current) => current.map((custom) => custom.id === column.key ? { ...custom, visible: !custom.visible } : custom));
    },
  });

  const addCustomColumn = () => {
    const label = newColumnName.trim();
    if (!label) return;
    const id = `custom_${Date.now().toString(36)}`;
    const custom = { id, label, type: newColumnType, visible: true } satisfies InvoiceCustomColumn;
    const order = normalizeOrder([...nextOrder.filter((key) => key !== 'total'), id]);
    const customList = [...nextCustomColumns, custom];
    setNextCustomColumns(customList);
    setNextOrder(order);
    setNewColumnName('');
    setAddingColumn(false);
    onOrderChange(order, customList);
  };

  return (
    <div className="invoice-modal fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="columns-modal-title">
      <div className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5"><h2 id="columns-modal-title" className="flex items-center gap-2 text-[18px] font-semibold leading-6 text-slate-900">Customize Columns &amp; Formulas <Lightbulb className="h-4 w-4 text-amber-500" /></h2><button type="button" onClick={onClose} aria-label="Close column editor" className="rounded-md p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></header>
        <div className="flex-1 overflow-y-auto px-3 py-2 sm:px-4">
          <div className="py-2">
            <div className="flex justify-end"><button type="button" onClick={() => setAddingColumn((current) => !current)} className="rounded-lg border border-[#2E6EAB] px-4 py-2 text-xs font-bold text-[#2E6EAB] hover:bg-[#EAF4FF]">+ Add New Column</button></div>
            {addingColumn ? <div className="mt-2 flex flex-col gap-2 rounded-lg border border-[#B7D4F0] bg-[#F5FAFF] p-3 sm:flex-row"><input autoFocus value={newColumnName} onChange={(event) => setNewColumnName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomColumn(); } }} placeholder="Column name" className="min-h-[38px] min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#2E6EAB]" /><select value={newColumnType} onChange={(event) => setNewColumnType(event.target.value as InvoiceCustomColumn['type'])} className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="TEXT">Text</option><option value="NUMBER">Number</option><option value="CURRENCY">Currency</option></select><button type="button" disabled={!newColumnName.trim()} onClick={addCustomColumn} className="rounded-lg bg-[#2E6EAB] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Add</button></div> : null}
          </div>
          <div className="hidden grid-cols-[22px_34px_minmax(150px,1fr)_minmax(130px,0.8fr)_38px] gap-x-2 py-2 text-[11px] font-semibold text-slate-500 sm:grid"><span /><span /><span>Column Name</span><span>Column Type</span><span /></div>
          <div className="mb-1 grid grid-cols-[22px_34px_minmax(0,1fr)_38px] gap-x-2 border-b border-slate-100 py-3 sm:grid-cols-[22px_34px_minmax(150px,1fr)_minmax(130px,0.8fr)_38px]"><LockKeyhole className="mt-2.5 h-3.5 w-3.5 text-slate-300" /><span className="mt-2.5 text-xs font-semibold text-slate-600">A1</span><div className="min-h-[38px] rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2.5 text-xs font-semibold text-slate-600">Item</div><div className="col-start-3 mt-2 text-[11px] font-semibold text-slate-400 sm:col-start-4 sm:mt-2.5">LOCKED · FIRST</div></div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragOver={onDragOver} onDragCancel={() => { setActiveId(null); setOverId(null); }} onDragEnd={onDragEnd}>
            <SortableContext items={movableDefinitions.map((column) => column.key)} strategy={verticalListSortingStrategy}>{movableDefinitions.map((column) => <SortableColumnRow key={column.key} {...rowProps(column)} isOver={overId === column.key && activeId !== column.key} />)}</SortableContext>
            {totalDefinition ? <ColumnRow {...rowProps(totalDefinition)} locked /> : null}
            <DragOverlay>{activeDefinition ? <div className="rounded-lg border-2 border-[#2E6EAB] bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-2xl"><span className="inline-flex items-center gap-2"><GripVertical className="h-4 w-4 text-[#2E6EAB]" />{getLabel(activeDefinition.key)}</span></div> : null}</DragOverlay>
          </DndContext>
          <section className="sticky bottom-0 mt-4 rounded-t-xl bg-[#2E6EAB] px-3 py-3 text-white shadow-[0_-8px_20px_rgba(15,23,42,0.08)]"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-100">Live table preview</p><div className="flex min-w-0 items-center gap-3 overflow-hidden text-[10px] font-bold"><span className="min-w-[80px] flex-1">Item</span>{previewColumns.map((column) => <span key={column.key} className="max-w-[72px] truncate">{getLabel(column.key)}</span>)}</div></section>
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-3 py-3 sm:px-4"><button type="button" onClick={onClose} className="mr-auto rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">Cancel</button><button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"><RotateCcw className="h-3.5 w-3.5" />Reset to Default</button><button type="button" onClick={() => onApply(nextColumns, normalizeOrder(nextOrder), nextCustomColumns, nextLabels, nextFormulas)} className="rounded-lg bg-[#2E6EAB] px-4 py-2 text-xs font-bold text-white hover:bg-[#245B8F]">Save Changes</button></footer>
      </div>
    </div>
  );
}
