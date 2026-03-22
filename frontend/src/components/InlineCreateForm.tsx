import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCategory, createFinancialSource } from '../services/api';
import { Category, CategoryType, FinancialSource, FinancialSourceType } from '../types';

const DEFAULT_CATEGORY_COLOR = '#6b7280';

interface InlineCategoryFormProps {
  variant: 'category';
  defaultType?: CategoryType;
  onCreated: (created: Category) => void;
  onClose: () => void;
}

interface InlineFinancialSourceFormProps {
  variant: 'financialSource';
  onCreated: (created: FinancialSource) => void;
  onClose: () => void;
}

type InlineCreateFormProps = InlineCategoryFormProps | InlineFinancialSourceFormProps;

function InlineCategoryFields({
  defaultType,
  onCreated,
  onClose,
}: {
  defaultType?: CategoryType;
  onCreated: (created: Category) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(defaultType ?? 'Expense');
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (name.trim().length < 2) {
      toast.error('O nome deve ter pelo menos 2 caracteres.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await createCategory({ name: name.trim(), type, color });
      toast.success(`Categoria "${created.name}" criada!`);
      onCreated(created);
    } catch {
      toast.error('Nao foi possivel criar a categoria.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-600 border border-slate-500 rounded-md p-2 text-sm text-slate-100 placeholder-slate-400 focus:ring-1 focus:ring-green-500"
          placeholder="Ex: Supermercado"
          required
          disabled={isSaving}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
        <div className="flex bg-slate-900 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setType('Expense')}
            disabled={isSaving}
            className={`w-1/2 py-1 rounded-md text-xs font-bold transition-colors ${type === 'Expense' ? 'bg-red-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('Income')}
            disabled={isSaving}
            className={`w-1/2 py-1 rounded-md text-xs font-bold transition-colors ${type === 'Income' ? 'bg-green-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
          >
            Receita
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Cor</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={isSaving}
            className="h-8 w-12 rounded border border-slate-500 bg-slate-600 cursor-pointer p-0.5"
          />
          <span className="text-slate-400 text-xs font-mono">{color}</span>
          <span
            className="inline-block w-5 h-5 rounded-full border border-slate-500 shrink-0"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 rounded-md font-semibold transition disabled:bg-slate-500"
        >
          {isSaving ? 'Criando...' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

function InlineFinancialSourceFields({
  onCreated,
  onClose,
}: {
  onCreated: (created: FinancialSource) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinancialSourceType>('Account');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (name.trim().length < 2) {
      toast.error('O nome deve ter pelo menos 2 caracteres.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await createFinancialSource({
        name: name.trim(),
        type,
        closingDay: type === 'Card' && closingDay ? parseInt(closingDay) : null,
        dueDay: type === 'Card' && dueDay ? parseInt(dueDay) : null,
      });
      toast.success(`Origem "${created.name}" criada!`);
      onCreated(created);
    } catch {
      toast.error('Nao foi possivel criar a origem financeira.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-600 border border-slate-500 rounded-md p-2 text-sm text-slate-100 placeholder-slate-400 focus:ring-1 focus:ring-green-500"
          placeholder="Ex: Nubank"
          required
          disabled={isSaving}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FinancialSourceType)}
          className="w-full bg-slate-600 border border-slate-500 rounded-md p-2 text-sm text-slate-100 focus:ring-1 focus:ring-green-500"
          disabled={isSaving}
        >
          <option value="Account">Conta Corrente</option>
          <option value="Card">Cartao de Credito</option>
          <option value="Cash">Dinheiro</option>
        </select>
      </div>

      {type === 'Card' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dia Fechamento</label>
            <input
              type="number"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              className="w-full bg-slate-600 border border-slate-500 rounded-md p-2 text-sm text-slate-100 focus:ring-1 focus:ring-green-500"
              min="1"
              max="31"
              placeholder="Ex: 10"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dia Vencimento</label>
            <input
              type="number"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full bg-slate-600 border border-slate-500 rounded-md p-2 text-sm text-slate-100 focus:ring-1 focus:ring-green-500"
              min="1"
              max="31"
              placeholder="Ex: 20"
              disabled={isSaving}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 rounded-md font-semibold transition disabled:bg-slate-500"
        >
          {isSaving ? 'Criando...' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

export function InlineCreateForm(props: InlineCreateFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        props.onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [props.onClose]);

  const title = props.variant === 'category' ? 'Nova Categoria' : 'Nova Origem Financeira';

  return (
    <div
      ref={containerRef}
      className="mt-2 bg-slate-700 border border-slate-500 rounded-lg p-4 shadow-xl z-10"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <button
          type="button"
          onClick={props.onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      {props.variant === 'category' ? (
        <InlineCategoryFields
          defaultType={(props as InlineCategoryFormProps).defaultType}
          onCreated={(props as InlineCategoryFormProps).onCreated}
          onClose={props.onClose}
        />
      ) : (
        <InlineFinancialSourceFields
          onCreated={(props as InlineFinancialSourceFormProps).onCreated}
          onClose={props.onClose}
        />
      )}
    </div>
  );
}
