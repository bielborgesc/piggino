import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FixedBill, Category, FinancialSource, FixedBillUpdateData, FixedBillScope } from '../../../types';
import { getCategories, getFinancialSources } from '../../../services/api';
import { extractErrorMessage } from '../../../utils/errors';

interface FixedBillEditModalProps {
  isOpen: boolean;
  bill: FixedBill;
  scope: FixedBillScope;
  anchorMonth: string;
  onSave: (data: FixedBillUpdateData) => Promise<void>;
  onCancel: () => void;
}

export function FixedBillEditModal({
  isOpen,
  bill,
  scope,
  anchorMonth,
  onSave,
  onCancel,
}: FixedBillEditModalProps) {
  const [description, setDescription] = useState(bill.description);
  const [totalAmount, setTotalAmount] = useState(String(bill.totalAmount));
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [financialSourceId, setFinancialSourceId] = useState<number | ''>('');
  const [dayOfMonth, setDayOfMonth] = useState(String(bill.dayOfMonth));
  const [categories, setCategories] = useState<Category[]>([]);
  const [financialSources, setFinancialSources] = useState<FinancialSource[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadOptions() {
      try {
        const [cats, sources] = await Promise.all([getCategories(), getFinancialSources()]);
        setCategories(cats);
        setFinancialSources(sources);

        const matchedCategory = cats.find((c) => c.name === bill.categoryName);
        if (matchedCategory) setCategoryId(matchedCategory.id);

        const matchedSource = sources.find((s) => s.name === bill.financialSourceName);
        if (matchedSource) setFinancialSourceId(matchedSource.id);
      } catch (err) {
        setLoadError(extractErrorMessage(err, 'Não foi possível carregar categorias e fontes.'));
      }
    }

    loadOptions();
  }, [isOpen, bill.categoryName, bill.financialSourceName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (categoryId === '' || financialSourceId === '') return;

    const day = parseInt(dayOfMonth, 10);
    if (isNaN(day) || day < 1 || day > 31) return;

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) return;

    const updateData: FixedBillUpdateData = {
      scope,
      anchorMonth,
      description,
      totalAmount: amount,
      categoryId: categoryId as number,
      financialSourceId: financialSourceId as number,
      dayOfMonth: day,
    };

    setIsSaving(true);
    try {
      await onSave(updateData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-xl font-bold text-white">Editar Conta Fixa</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="overflow-y-auto flex-1 px-6 space-y-4">
        {loadError && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
            {loadError}
          </div>
        )}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={150}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Dia do vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Fonte financeira</label>
            <select
              value={financialSourceId}
              onChange={(e) => setFinancialSourceId(Number(e.target.value))}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione uma fonte</option>
              {financialSources.map((src) => (
                <option key={src.id} value={src.id}>{src.name}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
