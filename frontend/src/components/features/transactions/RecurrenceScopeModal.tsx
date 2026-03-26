import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RecurrenceScope } from '../../../types';

interface ScopeOption {
  value: RecurrenceScope;
  label: string;
  description: string;
}

const SCOPE_OPTIONS: ScopeOption[] = [
  {
    value: 'OnlyThis',
    label: 'Somente esta',
    description: 'Apenas esta ocorrência será afetada.',
  },
  {
    value: 'ThisAndFuture',
    label: 'Esta e as futuras',
    description: 'Esta e todas as ocorrências posteriores serão afetadas.',
  },
  {
    value: 'ThisAndPast',
    label: 'Esta e as passadas',
    description: 'Esta e todas as ocorrências anteriores serão afetadas.',
  },
  {
    value: 'All',
    label: 'Todas',
    description: 'Todas as ocorrências desta recorrência serão afetadas.',
  },
];

type ModalVariant = 'recurrence' | 'installment';

interface RecurrenceScopeModalProps {
  isOpen: boolean;
  action: 'edit' | 'delete';
  variant?: ModalVariant;
  onConfirm: (scope: RecurrenceScope) => void;
  onCancel: () => void;
}

const TITLES: Record<ModalVariant, Record<'edit' | 'delete', string>> = {
  recurrence: {
    edit: 'Editar transação recorrente',
    delete: 'Excluir transação recorrente',
  },
  installment: {
    edit: 'Editar transação parcelada',
    delete: 'Excluir transação parcelada',
  },
};

const DESCRIPTIONS: Record<ModalVariant, string> = {
  recurrence: 'Esta é uma transação recorrente. Selecione quais ocorrências devem ser afetadas:',
  installment: 'Esta é uma transação parcelada. Selecione quais parcelas devem ser afetadas:',
};

export function RecurrenceScopeModal({ isOpen, action, variant = 'recurrence', onConfirm, onCancel }: RecurrenceScopeModalProps) {
  const [selectedScope, setSelectedScope] = useState<RecurrenceScope>('OnlyThis');

  if (!isOpen) return null;

  const title = TITLES[variant][action];
  const description = DESCRIPTIONS[variant];
  const confirmLabel = action === 'edit' ? 'Confirmar edição' : 'Confirmar exclusão';
  const confirmClass = action === 'delete'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-green-600 hover:bg-green-700';

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
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 space-y-4">
          <p className="text-slate-400 text-sm">{description}</p>

          <div className="space-y-3">
            {SCOPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedScope === option.value
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                }`}
              >
                <input
                  type="radio"
                  name="recurrenceScope"
                  value={option.value}
                  checked={selectedScope === option.value}
                  onChange={() => setSelectedScope(option.value)}
                  className="mt-0.5 accent-green-500"
                />
                <div>
                  <p className="text-white font-medium text-sm">{option.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-700 shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(selectedScope)}
            className={`px-4 py-2 rounded-lg text-white font-semibold text-sm transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
