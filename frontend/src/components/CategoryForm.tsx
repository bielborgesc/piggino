import React, { useState, useEffect } from 'react';
import { Category, CategoryData, CategoryType, BudgetBucket } from '../types';

const DEFAULT_COLOR = '#6b7280';
const DEFAULT_BUDGET_BUCKET: BudgetBucket = 'None';

interface BudgetBucketOption {
  value: BudgetBucket;
  label: string;
  activeClassName: string;
}

const BUDGET_BUCKET_OPTIONS: BudgetBucketOption[] = [
  { value: 'None', label: 'Nenhum', activeClassName: 'bg-slate-500 text-white' },
  { value: 'Needs', label: 'Necessidades (50%)', activeClassName: 'bg-blue-500 text-white' },
  { value: 'Wants', label: 'Desejos (30%)', activeClassName: 'bg-purple-500 text-white' },
  { value: 'Savings', label: 'Reservas (20%)', activeClassName: 'bg-green-500 text-white' },
];

interface CategoryFormProps {
  onSave: (data: CategoryData) => void;
  onCancel: () => void;
  initialData?: Category | null;
  isSaving: boolean;
}

export function CategoryForm({ onSave, onCancel, initialData, isSaving }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('Expense');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [budgetBucket, setBudgetBucket] = useState<BudgetBucket>(DEFAULT_BUDGET_BUCKET);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setColor(initialData.color ?? DEFAULT_COLOR);
      setBudgetBucket(initialData.budgetBucket ?? DEFAULT_BUDGET_BUCKET);
    } else {
      setName('');
      setType('Expense');
      setColor(DEFAULT_COLOR);
      setBudgetBucket(DEFAULT_BUDGET_BUCKET);
    }
  }, [initialData]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ name, type, color, budgetBucket });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
          Nome da Categoria
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 transition"
          placeholder="Ex: Supermercado"
          required
          disabled={isSaving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Tipo
        </label>
        <div className="flex bg-slate-900 rounded-md p-1">
          <button
            type="button"
            onClick={() => setType('Expense')}
            disabled={isSaving}
            className={`w-1/2 p-2 rounded-md font-bold transition-colors text-sm ${type === 'Expense' ? 'bg-red-500 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('Income')}
            disabled={isSaving}
            className={`w-1/2 p-2 rounded-md font-bold transition-colors text-sm ${type === 'Income' ? 'bg-green-500 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
          >
            Receita
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-slate-300">
            Metodo 50/30/20
          </label>
          <span className="text-xs text-slate-500 italic">Usado pelo metodo 50/30/20</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_BUCKET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setBudgetBucket(option.value)}
              disabled={isSaving}
              className={`p-2 rounded-md font-semibold transition-colors text-sm border ${
                budgetBucket === option.value
                  ? `${option.activeClassName} border-transparent`
                  : 'border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-slate-300 mb-2">
          Cor da Categoria
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={isSaving}
            className="h-10 w-16 rounded-md border border-slate-600 bg-slate-700 cursor-pointer p-1 disabled:opacity-50"
          />
          <span className="text-slate-400 text-sm font-mono">{color}</span>
          <span
            className="inline-block w-6 h-6 rounded-full border border-slate-600 shrink-0"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition flex items-center disabled:bg-slate-500"
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
