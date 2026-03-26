import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FixedBillScope } from '../../../types';

interface ScopeOption {
  value: FixedBillScope;
  label: string;
  description: string;
}

const SCOPE_OPTIONS: ScopeOption[] = [
  {
    value: 'All',
    label: 'Todos os meses',
    description: 'Esta ação afetará todos os meses desta conta fixa.',
  },
  {
    value: 'FromThisMonthForward',
    label: 'Deste mês em diante',
    description: 'Apenas este mês e os futuros serão afetados.',
  },
  {
    value: 'FromThisMonthBackward',
    label: 'Deste mês para trás',
    description: 'Apenas este mês e os anteriores serão afetados.',
  },
];

interface FixedBillScopeModalProps {
  isOpen: boolean;
  action: 'edit' | 'delete';
  currentMonth: string;
  onConfirm: (scope: FixedBillScope, anchorMonth: string) => void;
  onCancel: () => void;
}

export function FixedBillScopeModal({
  isOpen,
  action,
  currentMonth,
  onConfirm,
  onCancel,
}: FixedBillScopeModalProps) {
  const [selectedScope, setSelectedScope] = useState<FixedBillScope>('All');
  const [anchorMonth, setAnchorMonth] = useState<string>(currentMonth);

  if (!isOpen) return null;

  const title = action === 'edit' ? 'Editar conta fixa' : 'Excluir conta fixa';
  const confirmLabel = action === 'delete' ? 'Confirmar exclusão' : 'Confirmar edição';
  const confirmClass =
    action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

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
          <p className="text-slate-400 text-sm">
            Esta é uma conta fixa. Selecione a partir de qual mês a ação deve ser aplicada:
          </p>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Mês de referência</label>
            <input
              type="month"
              value={anchorMonth}
              onChange={(e) => setAnchorMonth(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
            />
          </div>

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
                  name="fixedBillScope"
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
            onClick={() => onConfirm(selectedScope, anchorMonth)}
            className={`px-4 py-2 rounded-lg text-white font-semibold text-sm transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
