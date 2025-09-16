import React, { useState, useEffect } from 'react';
import { FinancialSource, FinancialSourceData, FinancialSourceType } from '../types';

interface FinancialSourceFormProps {
  onSave: (data: FinancialSourceData) => void;
  onCancel: () => void;
  initialData?: FinancialSource | null;
  isSaving: boolean;
}

export function FinancialSourceForm({ onSave, onCancel, initialData, isSaving }: FinancialSourceFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinancialSourceType>('Account');
  const [closingDay, setClosingDay] = useState<number | undefined>();
  const [dueDay, setDueDay] = useState<number | undefined>();

  useEffect(() => {
  if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setClosingDay(initialData.closingDay ?? undefined);
      setDueDay(initialData.dueDay ?? undefined);
    } else {
      setName('');
      setType('Account');
      setClosingDay(undefined);
      setDueDay(undefined);
    }
  }, [initialData]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const data: FinancialSourceData = { 
      name, 
      type,
      closingDay: type === 'Card' ? closingDay : null,
      dueDay: type === 'Card' ? dueDay : null,
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
          Nome da Fonte Financeira
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 transition"
          placeholder="Ex: Cartão Nubank"
          required
          disabled={isSaving}
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-2">
          Tipo
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as FinancialSourceType)}
          className="w-full bg-slate-700 border-slate-600 rounded-md p-3"
          disabled={isSaving}
        >
          <option value="Account">Conta Corrente</option>
          <option value="Card">Cartão de Crédito</option>
          <option value="Cash">Dinheiro</option>
        </select>
      </div>

      {type === 'Card' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="closingDay" className="block text-sm font-medium text-slate-300 mb-2">
              Dia de Fechamento
            </label>
            <input
              type="number"
              id="closingDay"
              value={closingDay || ''}
              onChange={(e) => setClosingDay(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-slate-700 border-slate-600 rounded-md p-3"
              min="1" max="31"
            />
          </div>
          <div>
            <label htmlFor="dueDay" className="block text-sm font-medium text-slate-300 mb-2">
              Dia de Vencimento
            </label>
            <input
              type="number"
              id="dueDay"
              value={dueDay || ''}
              onChange={(e) => setDueDay(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-slate-700 border-slate-600 rounded-md p-3"
              min="1" max="31"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} disabled={isSaving} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition">
          Cancelar
        </button>
        <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition flex items-center disabled:bg-slate-500">
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}