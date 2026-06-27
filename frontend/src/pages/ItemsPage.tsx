import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Edit3, LoaderCircle, Package, Plus, Search, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { getDisplayAuthUser } from '../auth';
import { createProduct, deleteProduct, fetchProducts, ProductInput, SavedProduct, updateProduct } from '../productApi';

const EMPTY_FORM: ProductInput = {
  name: '',
  description: '',
  itemType: 'Product',
  unit: 'Nos',
  price: 0,
  gstRate: 0,
  complimentary: false,
};

function formatMoney(value: number) {
  return `INR ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function ItemsPage() {
  const { displayName, initials } = getDisplayAuthUser();
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState<SavedProduct | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);

  async function loadItems() {
    setIsLoading(true);
    setError('');
    try {
      setItems(await fetchProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load items.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.name} ${item.description} ${item.itemType} ${item.unit}`.toLowerCase();
      return !needle || haystack.includes(needle);
    });
  }, [items, query]);

  const stats = [
    { label: 'Total Items', value: String(items.length), helper: 'Saved products and services', icon: Package, tone: 'bg-[#EEF2FF] text-[#2457F0]' },
    { label: 'Active Items', value: String(items.filter((item) => !item.complimentary).length), helper: 'Billable saved items', icon: Tag, tone: 'bg-[#E9FCEB] text-[#16A34A]' },
    { label: 'Services', value: String(items.filter((item) => item.itemType === 'Service').length), helper: 'Service-style items', icon: ShoppingBag, tone: 'bg-[#F1EDFF] text-[#7C3AED]' },
    { label: 'Products', value: String(items.filter((item) => item.itemType === 'Product').length), helper: 'Product-style items', icon: Package, tone: 'bg-[#FFF0E1] text-[#F97316]' },
  ] as const;

  function openCreateForm() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEditForm(item: SavedProduct) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      itemType: item.itemType || 'Product',
      unit: item.unit || 'Nos',
      price: Number(item.price || 0),
      gstRate: Number(item.gstRate || 0),
      complimentary: Boolean(item.complimentary),
    });
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Item name is required.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        unit: form.unit.trim() || (form.itemType === 'Service' ? 'Hour' : 'Nos'),
        price: Number(form.price || 0),
        gstRate: Number(form.gstRate || 0),
      };
      const response = editingItem ? await updateProduct(editingItem.id, payload) : await createProduct(payload);
      setItems((current) => {
        const withoutCurrent = current.filter((item) => item.id !== response.item.id);
        return [response.item, ...withoutCurrent];
      });
      setIsFormOpen(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save item.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: SavedProduct) {
    const confirmed = window.confirm(`Delete "${item.name}" from your saved items?`);
    if (!confirmed) return;

    setError('');
    try {
      await deleteProduct(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete item.');
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">Items / Products</h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500">
              Create reusable products and services for your quotes. Only your account can see these items.
            </p>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2457F0] text-[13px] font-semibold text-white shadow-sm">
              {initials}
            </button>
            <button type="button" className="flex items-center gap-2 text-[14px] font-medium text-slate-800">
              {displayName}
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
                <div className="flex items-center gap-4">
                  <div className={`flex h-[56px] w-[56px] items-center justify-center rounded-[14px] ${stat.tone}`}>
                    <Icon className="h-[28px] w-[28px] stroke-[1.9]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-700">{stat.label}</p>
                    <p className="mt-1 text-[34px] font-bold leading-none tracking-tight text-slate-900">{stat.value}</p>
                    <p className="mt-2 text-[12px] font-medium text-slate-500">{stat.helper}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <button type="button" className="w-fit border-b-2 border-[#2457F0] pb-3 text-[15px] font-semibold text-[#2457F0]">All Items</button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:w-[340px]">
                <Search className="h-5 w-5 shrink-0 text-slate-800" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search saved items..."
                  className="w-full border-none bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2457F0] px-5 text-[14px] font-semibold text-white shadow-lg shadow-blue-100" onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                Add New Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full border-collapse text-left">
              <thead className="bg-[#FBFCFF]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-500">
                  <th className="px-4 py-4 md:px-5">Item Name</th>
                  <th className="px-4 py-4 md:px-5">Type</th>
                  <th className="px-4 py-4 md:px-5">Unit</th>
                  <th className="px-4 py-4 md:px-5">GST</th>
                  <th className="px-4 py-4 md:px-5">Price</th>
                  <th className="px-4 py-4 md:px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      <LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin text-[#2457F0]" />
                      Loading saved items...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      No saved items yet. Click Add New Item to create one.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200/70 text-[14px]">
                      <td className="px-4 py-5 md:px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2457F0]">
                            {row.itemType === 'Service' ? <ShoppingBag className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{row.name}</p>
                            <p className="mt-1 max-w-[420px] truncate text-[12px] text-slate-500">{row.description || 'No description'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 md:px-5 text-slate-800">{row.itemType}</td>
                      <td className="px-4 py-5 md:px-5 text-slate-800">{row.unit}</td>
                      <td className="px-4 py-5 md:px-5 text-slate-800">{row.gstRate}%</td>
                      <td className="px-4 py-5 md:px-5 font-semibold text-slate-900">{row.complimentary ? 'Free' : formatMoney(row.price)}</td>
                      <td className="px-4 py-5 md:px-5">
                        <div className="flex items-center justify-center gap-3">
                          <button type="button" onClick={() => openEditForm(row)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Edit item">
                            <Edit3 className="h-4.5 w-4.5 text-slate-700" />
                          </button>
                          <button type="button" onClick={() => handleDelete(row)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Delete item">
                            <Trash2 className="h-4.5 w-4.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Save reusable products or services for future quotes.</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Item Name</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#2457F0]" placeholder="Website design package" />
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Type</span>
                <select value={form.itemType} onChange={(event) => setForm((current) => ({ ...current, itemType: event.target.value as ProductInput['itemType'], unit: event.target.value === 'Service' ? 'Hour' : 'Nos' }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#2457F0]">
                  <option value="Product">Product</option>
                  <option value="Service">Service</option>
                </select>
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Unit</span>
                <input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#2457F0]" placeholder="Nos, Hour, Kg" />
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Price</span>
                <input type="number" min="0" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#2457F0]" />
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">GST %</span>
                <input type="number" min="0" value={form.gstRate} onChange={(event) => setForm((current) => ({ ...current, gstRate: Number(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#2457F0]" />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Description</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-[96px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#2457F0]" placeholder="Short description shown in your item list" />
              </label>

              <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input type="checkbox" checked={form.complimentary} onChange={(event) => setForm((current) => ({ ...current, complimentary: event.target.checked }))} className="h-4 w-4 accent-[#2457F0]" />
                <span className="text-sm font-semibold text-slate-700">Mark as complimentary / free item</span>
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsFormOpen(false)} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2457F0] px-5 text-sm font-bold text-white shadow-lg shadow-blue-100 disabled:cursor-not-allowed disabled:opacity-70">
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {editingItem ? 'Update Item' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
