import React, { useState, useEffect } from 'react';
import { Category, CategoryData, CategoryType } from '../types';

interface CategoryFormProps {
  onSave: (data: CategoryData) => void;
  onCancel: () => void;
  initialData?: Category | null;
  isSaving: boolean;
}

export function CategoryForm({ onSave, onCancel, initialData, isSaving }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('Expense');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
    } else {
      setName('');
      setType('Expense');
    }
  }, [initialData]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ name, type });
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