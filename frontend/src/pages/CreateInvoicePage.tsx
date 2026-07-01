import React, { useState } from 'react';
import {
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  ImagePlus,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  formatInvoiceCurrency,
  getDiscountAmount,
  getInvoiceTotal,
  getSubTotal,
  makeInvoiceLineItem,
  makeInvoiceTerm,
  useInvoiceDraft,
} from '../invoiceDraft';

const steps = [
  { number: '1', label: 'Invoice Details', active: true },
  { number: '2', label: 'Your Bank Details', active: false, optional: true },
  { number: '3', label: 'Select Design & Colors', active: false, subtitle: '(Download or Email Invoice)' },
];

const sampleBusinesses = [
  {
    businessName: 'Sakshi',
    email: 'sakshi30@gmail.com',
    businessAddress: 'Surat, Gujarat, India 395017',
    gstin: '24BFTPS4040D1ZF',
    pan: 'BFTPS4040D',
    businessPostal: '395017',
    businessCity: 'Surat',
    businessCountry: 'India',
  },
  {
    businessName: 'Semixon Creative Agency',
    email: 'hello@semixon.com',
    businessAddress: 'Hubballi, Karnataka, India 580021',
    gstin: '29ABCDE1234F1Z7',
    pan: 'ABCDE1234F',
    businessPostal: '580021',
    businessCity: 'Hubballi',
    businessCountry: 'India',
  },
];

const sampleClients = [
  {
    clientName: 'S. Demo',
    billedToCompany: 'S Demo Private Limited',
    billedToAddress: 'MG Road, Bengaluru',
    billedToCity: 'Bengaluru',
    billedToCountry: 'India',
    billedToPostal: '560001',
    clientId: '015845',
  },
  {
    clientName: 'Refrens Client',
    billedToCompany: 'Refrens Technologies',
    billedToAddress: 'Satellite Road, Ahmedabad',
    billedToCity: 'Ahmedabad',
    billedToCountry: 'India',
    billedToPostal: '380015',
    clientId: 'RFN2401',
  },
];

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-xl font-black tracking-[-0.03em] text-slate-900">{title}</h3>
        {subtitle ? <span className="text-sm font-medium text-slate-500">{subtitle}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        <span className="text-rose-500">*</span>
      </span>
      <div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
        />
        {icon}
      </div>
    </label>
  );
}

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useInvoiceDraft();
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [showShippingExtraFields, setShowShippingExtraFields] = useState(false);
  const [isBusinessEditing, setIsBusinessEditing] = useState(true);
  const [businessIndex, setBusinessIndex] = useState(0);
  const [clientIndex, setClientIndex] = useState(0);

  const updateDraft = (patch: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...patch }));
  const subtotal = getSubTotal(draft.lineItems);
  const discountAmount = getDiscountAmount(draft);
  const total = getInvoiceTotal(draft);

  const cycleBusiness = () => {
    const nextIndex = (businessIndex + 1) % sampleBusinesses.length;
    setBusinessIndex(nextIndex);
    updateDraft(sampleBusinesses[nextIndex]);
  };

  const cycleClient = () => {
    const nextIndex = (clientIndex + 1) % sampleClients.length;
    setClientIndex(nextIndex);
    updateDraft(sampleClients[nextIndex]);
  };

  return (
    <div className="min-h-full bg-[#F8FAFF] px-3 py-4 md:px-5 md:py-6">
      <div className="mx-auto max-w-[1380px] space-y-4 md:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${step.active ? 'border-[#2E6EAB] bg-[#2E6EAB] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                    {step.number}
                  </div>
                  <div className="pt-0.5">
                    <div className={`text-sm font-bold ${step.active ? 'text-slate-900' : 'text-slate-600'}`}>{step.label}</div>
                    {'optional' in step && step.optional ? <div className="text-xs text-slate-400">(Optional)</div> : null}
                    {'subtitle' in step && step.subtitle ? <div className="text-xs text-slate-400">{step.subtitle}</div> : null}
                  </div>
                </div>
                {index < steps.length - 1 ? <ChevronRight className="hidden h-5 w-5 text-slate-300 lg:block" /> : null}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white px-4 py-5 shadow-sm md:px-8 md:py-7">
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-900">Invoice</h1>
              <button
                onClick={() => updateDraft({ showSubtitle: !draft.showSubtitle })}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#B7D4F0] bg-[#EAF4FF] px-3 py-1.5 text-sm font-semibold text-[#2E6EAB]"
              >
                <CirclePlus className="h-4 w-4" />
                {draft.showSubtitle ? 'Hide Sub Title' : 'Add Sub Title'}
              </button>
              {draft.showSubtitle ? (
                <div className="mx-auto mt-3 max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <input
                    value={draft.subtitle}
                    onChange={(event) => updateDraft({ subtitle: event.target.value })}
                    placeholder="Enter invoice subtitle"
                    className="w-full bg-transparent text-center text-sm font-medium text-slate-700 outline-none"
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <Field label="Invoice No" value={draft.invoiceNumber} onChange={(invoiceNumber) => updateDraft({ invoiceNumber })} />
                  <p className="mt-2 text-sm font-semibold text-slate-400">Latest Invoice No: A00005 (Jan 17, 2024)</p>
                </div>
                <Field
                  label="Invoice Date"
                  value={draft.invoiceDate}
                  type="date"
                  onChange={(invoiceDate) => updateDraft({ invoiceDate })}
                  icon={<CalendarDays className="h-4 w-4 text-slate-400" />}
                />
                <div className="space-y-3 pt-1">
                  <button onClick={() => updateDraft({ showDueDate: !draft.showDueDate })} className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]">
                    <CirclePlus className="h-4 w-4" />
                    {draft.showDueDate ? 'Hide Due Date' : 'Add Due Date'}
                  </button>
                  <button onClick={() => setShowExtraFields((current) => !current)} className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]">
                    <CirclePlus className="h-4 w-4" />
                    {showExtraFields ? 'Hide Extra Fields' : 'Add More Fields'}
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-center lg:justify-end">
                <label className="flex min-h-[124px] w-full max-w-[270px] cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-[#B7D4F0] bg-[#F4FAFF] px-5 text-base font-semibold text-[#5D78A4]">
                  <ImagePlus className="h-6 w-6" />
                  {draft.logoName || 'Add Business Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => updateDraft({ logoName: event.target.files?.[0]?.name ?? '' })}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="Billed By" subtitle="(Your Details)">
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={cycleBusiness}
                    className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#2E6EAB]">
                        <ReceiptText className="h-4 w-4" />
                      </div>
                      {draft.businessName}
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  <div className={`rounded-2xl border bg-white p-4 shadow-sm ${isBusinessEditing ? 'border-[#B7D4F0] ring-2 ring-[#EAF4FF]' : 'border-slate-200'}`}>
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-2xl font-black tracking-[-0.03em] text-slate-900">Business details</h4>
                      <button onClick={() => setIsBusinessEditing((current) => !current)} className="inline-flex items-center gap-2 text-sm font-bold text-[#2E6EAB]">
                        <Pencil className="h-4 w-4" />
                        {isBusinessEditing ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Business Name" value={draft.businessName} onChange={(businessName) => updateDraft({ businessName })} />
                      <Field label="Email" value={draft.email} onChange={(email) => updateDraft({ email })} />
                      <Field label="Address" value={draft.businessAddress} onChange={(businessAddress) => updateDraft({ businessAddress })} />
                      <Field label="GSTIN" value={draft.gstin} onChange={(gstin) => updateDraft({ gstin })} />
                      <Field label="PAN" value={draft.pan} onChange={(pan) => updateDraft({ pan })} />
                      <Field label="Postal" value={draft.businessPostal} onChange={(businessPostal) => updateDraft({ businessPostal })} />
                      {showExtraFields ? (
                        <>
                          <Field label="City" value={draft.businessCity} onChange={(businessCity) => updateDraft({ businessCity })} />
                          <Field label="Country" value={draft.businessCountry} onChange={(businessCountry) => updateDraft({ businessCountry })} />
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Billed To" subtitle="(Client Details)">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Field label="Client Name" value={draft.clientName} onChange={(clientName) => updateDraft({ clientName })} />
                    </div>
                    <div className="flex items-end">
                      <button onClick={cycleClient} className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#2E6EAB] px-4 text-sm font-bold text-white shadow-sm">
                        <CirclePlus className="h-4 w-4" />
                        Add New Client
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Company Name" value={draft.billedToCompany} onChange={(billedToCompany) => updateDraft({ billedToCompany })} />
                      <Field label="Client ID" value={draft.clientId} onChange={(clientId) => updateDraft({ clientId })} />
                      <Field label="Address" value={draft.billedToAddress} onChange={(billedToAddress) => updateDraft({ billedToAddress })} />
                      <Field label="City" value={draft.billedToCity} onChange={(billedToCity) => updateDraft({ billedToCity })} />
                      <Field label="Country" value={draft.billedToCountry} onChange={(billedToCountry) => updateDraft({ billedToCountry })} />
                      <Field label="Postal" value={draft.billedToPostal} onChange={(billedToPostal) => updateDraft({ billedToPostal })} />
                      {showExtraFields ? (
                        <>
                          <Field label="PO Number" value={draft.subtitle} onChange={(subtitle) => updateDraft({ subtitle, showSubtitle: true })} />
                          <Field label="Reference Number" value={draft.clientId} onChange={(clientId) => updateDraft({ clientId })} />
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_128px]">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Invoice Date" value={draft.invoiceDate} type="date" onChange={(invoiceDate) => updateDraft({ invoiceDate })} icon={<CalendarDays className="h-4 w-4 text-slate-400" />} />
                  {draft.showDueDate ? <Field label="Due Date" value={draft.dueDate} type="date" onChange={(dueDate) => updateDraft({ dueDate })} icon={<CalendarDays className="h-4 w-4 text-slate-400" />} /> : <div />}
                  <Field label="Client ID" value={draft.clientId} onChange={(clientId) => updateDraft({ clientId })} />
                  <div className="flex items-end">
                    <button onClick={() => setShowExtraFields((current) => !current)} className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]">
                      <CirclePlus className="h-4 w-4" />
                      {showExtraFields ? 'Hide Extra Fields' : 'Add More Fields'}
                    </button>
                  </div>
                  {showExtraFields ? <Field label="Place Of Supply" value={draft.businessCountry} onChange={(businessCountry) => updateDraft({ businessCountry })} /> : null}
                  {showExtraFields ? <Field label="Purchase Order No" value={draft.invoiceNumber} onChange={(invoiceNumber) => updateDraft({ invoiceNumber })} /> : null}
                </div>
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-[#EAF4FF] p-4">
                  <div className="text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-[#2E6EAB] text-white shadow-sm">
                      <Banknote className="h-10 w-10" />
                    </div>
                    <button onClick={() => updateDraft({ currency: draft.currency === 'INR (INR, Rs)' ? 'USD ($)' : 'INR (INR, Rs)' })} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#2E6EAB]">
                      <Pencil className="h-4 w-4" />
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <label className="inline-flex items-center gap-3 text-sm font-bold text-[#2E6EAB]">
                <input type="checkbox" checked={draft.shippingEnabled} onChange={(event) => updateDraft({ shippingEnabled: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-[#2E6EAB] focus:ring-[#2E6EAB]" />
                Add Shipping Details
              </label>
              {draft.shippingEnabled ? (
                <div className="grid gap-4 xl:grid-cols-3">
                  <SectionCard title="Shipped From">
                    <div className="space-y-3">
                      <Field label="Business / Freelancer Name" value={draft.businessName} onChange={(businessName) => updateDraft({ businessName })} />
                      <Field label="Country" value={draft.businessCountry} onChange={(businessCountry) => updateDraft({ businessCountry })} />
                      <Field label="Address" value={draft.businessAddress} onChange={(businessAddress) => updateDraft({ businessAddress })} />
                      <Field label="City" value={draft.businessCity} onChange={(businessCity) => updateDraft({ businessCity })} />
                      <Field label="Postal Code" value={draft.businessPostal} onChange={(businessPostal) => updateDraft({ businessPostal })} />
                    </div>
                  </SectionCard>
                  <SectionCard title="Shipped To">
                    <div className="space-y-3">
                      <Field label="Client Business Name" value={draft.billedToCompany} onChange={(billedToCompany) => updateDraft({ billedToCompany })} />
                      <Field label="Country" value={draft.billedToCountry} onChange={(billedToCountry) => updateDraft({ billedToCountry })} />
                      <Field label="Address" value={draft.billedToAddress} onChange={(billedToAddress) => updateDraft({ billedToAddress })} />
                      <Field label="City" value={draft.billedToCity} onChange={(billedToCity) => updateDraft({ billedToCity })} />
                      <Field label="Postal Code" value={draft.billedToPostal} onChange={(billedToPostal) => updateDraft({ billedToPostal })} />
                      <button onClick={() => setShowShippingExtraFields((current) => !current)} className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]">
                        <CirclePlus className="h-4 w-4" />
                        {showShippingExtraFields ? 'Hide Extra Fields' : 'Add More Fields'}
                      </button>
                      {showShippingExtraFields ? <Field label="State" value={draft.billedToCity} onChange={(billedToCity) => updateDraft({ billedToCity })} /> : null}
                    </div>
                  </SectionCard>
                  <SectionCard title="Transport Details">
                    <div className="space-y-3">
                      <Field label="Mode of Transport" value={draft.transportMode} onChange={(transportMode) => updateDraft({ transportMode })} />
                      <Field label="Transporter" value={draft.transporter} onChange={(transporter) => updateDraft({ transporter })} />
                      <Field label="Distance (km)" value={draft.distanceKm} onChange={(distanceKm) => updateDraft({ distanceKm })} />
                      <button className="text-sm font-semibold text-[#2E6EAB]">Calculate distance here</button>
                    </div>
                  </SectionCard>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm">Configure Tax</button>
                <button className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm">
                  {draft.currency}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden md:grid grid-cols-[54px_minmax(200px,1.4fr)_110px_120px_120px_130px_44px] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <div>#</div><div>Item / Description</div><div>Quantity</div><div>Rate</div><div>Tax (%)</div><div>Amount</div><div />
                </div>
                <div className="divide-y divide-slate-200">
                  {draft.lineItems.map((row, index) => {
                    const amount = row.quantity * row.rate * (1 + row.tax / 100);
                    return (
                      <div key={row.id} className="grid gap-3 px-4 py-4 md:grid-cols-[54px_minmax(200px,1.4fr)_110px_120px_120px_130px_44px] md:items-center">
                        <div className="text-sm font-bold text-slate-900">{index + 1}</div>
                        <div className="grid gap-2">
                          <input value={row.name} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, name: e.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none" />
                          <input value={row.description} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, description: e.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 outline-none" />
                        </div>
                        <input type="number" value={row.quantity} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, quantity: Number(e.target.value) || 0 } : item) }))} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none" />
                        <input type="number" value={row.rate} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, rate: Number(e.target.value) || 0 } : item) }))} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none" />
                        <input type="number" value={row.tax} onChange={(e) => setDraft((current) => ({ ...current, lineItems: current.lineItems.map((item) => item.id === row.id ? { ...item, tax: Number(e.target.value) || 0 } : item) }))} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none" />
                        <div className="flex items-center text-sm font-bold text-slate-900">{formatInvoiceCurrency(amount)}</div>
                        <button onClick={() => setDraft((current) => ({ ...current, lineItems: current.lineItems.filter((item) => item.id !== row.id) }))} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="grid gap-4 border-t border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <button onClick={() => setDraft((current) => ({ ...current, lineItems: [...current.lineItems, makeInvoiceLineItem()] }))} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-dashed border-[#B7D4F0] bg-[#EAF4FF] px-4 text-sm font-bold text-[#2E6EAB]">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between font-semibold text-slate-600"><span>Sub Total</span><span>{formatInvoiceCurrency(subtotal)}</span></div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_82px_64px] sm:items-center">
                        <span className="font-semibold text-slate-600">Discount</span>
                        <input type="number" value={draft.discountValue} onChange={(e) => updateDraft({ discountValue: Number(e.target.value) || 0 })} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none" />
                        <select value={draft.discountType} onChange={(e) => updateDraft({ discountType: e.target.value as '%' | 'Flat' })} className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none">
                          <option value="%">%</option>
                          <option value="Flat">Flat</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between font-semibold text-slate-600"><span /><span>(-) {formatInvoiceCurrency(discountAmount)}</span></div>
                        <div className="text-right text-3xl font-black tracking-[-0.04em] text-[#2E6EAB]">{formatInvoiceCurrency(total)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Add Notes', icon: <ReceiptText className="h-4 w-4" />, action: () => updateDraft({ notes: `${draft.notes}\nNew note` }) },
                { label: 'Add Attachments', icon: <Upload className="h-4 w-4" />, action: () => updateDraft({ notes: `${draft.notes}\nAttachment added.` }) },
                { label: 'Add Additional Info', icon: <CirclePlus className="h-4 w-4" />, action: () => updateDraft({ subtitle: draft.subtitle || 'Additional information' , showSubtitle: true }) },
                { label: 'Add Signature', icon: <Pencil className="h-4 w-4" />, action: () => updateDraft({ notes: `${draft.notes}\nSigned by authorised person.` }) },
                { label: 'Add Contact Details', icon: <Package className="h-4 w-4" />, action: () => updateDraft({ paymentNotes: `${draft.paymentNotes}\nContact: ${draft.email}` }) },
              ].map((action) => (
                <button key={action.label} onClick={action.action} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#2E6EAB] shadow-sm">
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
              <SectionCard title="Terms and Conditions">
                <div className="space-y-4">
                  {draft.terms.map((term, index) => (
                    <div key={term.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                      <textarea
                        value={term.text}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            terms: current.terms.map((entry) => entry.id === term.id ? { ...entry, text: event.target.value } : entry),
                          }))
                        }
                        className="min-h-[60px] flex-1 resize-none bg-transparent text-sm font-medium leading-7 text-slate-700 outline-none"
                      />
                      <div className="flex items-center gap-2 pt-0.5 text-slate-400">
                        <button onClick={() => setDraft((current) => ({ ...current, terms: current.terms.filter((entry) => entry.id !== term.id) }))}><span className="text-lg">x</span></button>
                        <button><MoreVertical className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <button onClick={() => setDraft((current) => ({ ...current, terms: [...current.terms, makeInvoiceTerm()] }))} className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]">
                      <CirclePlus className="h-4 w-4" />
                      Add New Term
                    </button>
                    <button onClick={() => setDraft((current) => ({ ...current, terms: [...current.terms, makeInvoiceTerm()] }))} className="flex items-center gap-2 text-sm font-semibold text-[#2E6EAB]">
                      <CirclePlus className="h-4 w-4" />
                      Add New Group
                    </button>
                  </div>
                </div>
              </SectionCard>

              <div className="space-y-4">
                <SectionCard title="">
                  <div className="space-y-5">
                    <label className="inline-flex items-start gap-3 text-sm">
                      <input type="checkbox" checked={draft.recurring} onChange={(e) => updateDraft({ recurring: e.target.checked })} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2E6EAB] focus:ring-[#2E6EAB]" />
                      <span>
                        <span className="block font-semibold text-slate-700">This is a recurring invoice.</span>
                        <span className="block text-slate-400">A draft invoice will be created with same details every next period.</span>
                      </span>
                    </label>
                    <div>
                      <h4 className="text-xl font-black tracking-[-0.03em] text-slate-900">Advance Options</h4>
                      <div className="mt-3 space-y-3 text-sm">
                        <label className="inline-flex items-center gap-3 text-slate-700"><input type="checkbox" checked={draft.hidePlaceOfSupply} onChange={(e) => updateDraft({ hidePlaceOfSupply: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-[#2E6EAB]" />Hide Place Of Supply/Country Of Supply</label>
                        <label className="inline-flex items-center gap-3 text-slate-700"><input type="checkbox" checked={draft.addOriginalImages} onChange={(e) => updateDraft({ addOriginalImages: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-[#2E6EAB]" />Add Original Images in Line Items</label>
                        <label className="inline-flex items-center gap-3 text-slate-700"><input type="checkbox" checked={draft.fullWidthDescription} onChange={(e) => updateDraft({ fullWidthDescription: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-[#2E6EAB]" />Show description in full width</label>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
              <button onClick={() => window.location.assign('#/dashboard')} className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 shadow-sm">Cancel</button>
                <div className="flex items-stretch rounded-xl bg-[#2E6EAB] shadow-[0_12px_24px_rgba(46,110,171,0.22)]">
                <button onClick={() => navigate('/create-invoice/bank-details')} className="inline-flex min-h-[50px] items-center justify-center px-8 text-sm font-bold text-white">Save & Continue</button>
                <button className="border-l border-[#5D8CC0] px-4 text-white"><ChevronDown className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
