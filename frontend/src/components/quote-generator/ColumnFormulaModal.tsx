import React, { useState, useEffect } from 'react';
import { X, Plus, GripVertical, Eye, EyeOff, Trash2, Lightbulb } from 'lucide-react';
import { QuoteColumnConfig, DEFAULT_COLUMNS } from '../../types/structuredQuote';

interface ColumnFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: QuoteColumnConfig[];
  onSave: (columns: QuoteColumnConfig[]) => void;
}

export default function ColumnFormulaModal({
  isOpen,
  onClose,
  columns,
  onSave,
}: ColumnFormulaModalProps) {
  const [localColumns, setLocalColumns] = useState<QuoteColumnConfig[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalColumns(
        (columns && columns.length > 0 ? columns : DEFAULT_COLUMNS).map((c) => ({ ...c }))
      );
    }
  }, [isOpen, columns]);

  if (!isOpen) return null;

  const handleToggleVisibility = (id: string) => {
    setLocalColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col))
    );
  };

  const handleUpdateName = (id: string, name: string) => {
    setLocalColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, name } : col))
    );
  };

  const handleUpdateType = (id: string, type: 'TEXT' | 'NUMBER') => {
    setLocalColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, type } : col))
    );
  };

  const handleAddNewColumn = () => {
    const newColId = `col-custom-${Date.now()}`;
    const newCol: QuoteColumnConfig = {
      id: newColId,
      name: `Custom Column ${localColumns.length + 1}`,
      type: 'TEXT',
      visible: true,
      isCustom: true,
    };
    setLocalColumns((prev) => [...prev, newCol]);
  };

  const handleRemoveColumn = (id: string) => {
    setLocalColumns((prev) => prev.filter((col) => col.id !== id));
  };

  const handleReset = () => {
    setLocalColumns(DEFAULT_COLUMNS.map((c) => ({ ...c })));
  };

  const handleSave = () => {
    onSave(localColumns);
    onClose();
  };

  // Move column up/down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    // Don't move before the first element (Item is at index 0)
    if (targetIndex < 1 || targetIndex >= localColumns.length) return;

    setLocalColumns((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Customize Columns &amp; Formulas
            </h2>
            <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
            <p className="text-xs sm:text-sm text-gray-700">
              Add custom calculations, formulae and custom fields in your columns.
            </p>
            <button
              type="button"
              onClick={handleAddNewColumn}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Column</span>
            </button>
          </div>

          {/* Column Header Titles */}
          <div className="grid grid-cols-12 gap-3 px-2 pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1"></div>
            <div className="col-span-6">Column Name</div>
            <div className="col-span-4">Column Type</div>
            <div className="col-span-1 text-right">Visible</div>
          </div>

          {/* Column Rows */}
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {localColumns.map((col, index) => {
              const isItemCol = col.id === 'col-item';

              return (
                <div
                  key={col.id}
                  className={`grid grid-cols-12 gap-2 sm:gap-3 items-center p-2 rounded-xl border transition-all ${
                    col.visible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/70 opacity-60'
                  }`}
                >
                  {/* Drag / Position indicator */}
                  <div className="col-span-1 flex items-center justify-center text-gray-400">
                    {!isItemCol ? (
                      <div className="flex items-center gap-0.5">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col gap-0.5">
                          {index > 1 && (
                            <button
                              type="button"
                              onClick={() => handleMove(index, 'up')}
                              className="text-[9px] text-gray-400 hover:text-purple-600 leading-none"
                              title="Move up"
                            >
                              ▲
                            </button>
                          )}
                          {index < localColumns.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMove(index, 'down')}
                              className="text-[9px] text-gray-400 hover:text-purple-600 leading-none"
                              title="Move down"
                            >
                              ▼
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-gray-300">#</span>
                    )}
                  </div>

                  {/* Column Name Input */}
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={col.name}
                      disabled={isItemCol}
                      onChange={(e) => handleUpdateName(col.id, e.target.value)}
                      className={`w-full text-xs sm:text-sm px-3 py-2 border rounded-lg focus:outline-none transition-all ${
                        isItemCol
                          ? 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed font-medium'
                          : 'border-gray-200 bg-white text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                      }`}
                    />
                  </div>

                  {/* Column Type Select */}
                  <div className="col-span-4">
                    <select
                      value={col.type}
                      disabled={isItemCol}
                      onChange={(e) =>
                        handleUpdateType(col.id, e.target.value as 'TEXT' | 'NUMBER')
                      }
                      className={`w-full text-xs sm:text-sm px-2.5 py-2 border rounded-lg focus:outline-none transition-all ${
                        isItemCol
                          ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-medium'
                          : 'border-gray-200 bg-white text-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer'
                      }`}
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="NUMBER">NUMBER</option>
                    </select>
                  </div>

                  {/* Visibility & Delete actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {!isItemCol ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(col.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            col.visible
                              ? 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                              : 'text-gray-300 hover:text-gray-500'
                          }`}
                          title={col.visible ? 'Hide column' : 'Show column'}
                        >
                          {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                        </button>
                        {col.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(col.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="p-1.5 text-gray-300">
                        <Eye className="w-4 h-4 opacity-40" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              Reset to Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
