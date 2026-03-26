import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Goal, GoalData, GoalType } from '../../../types';

type GoalFormData = Omit<GoalData, 'targetAmount' | 'currentAmount'> & {
  targetAmount: number | '';
  currentAmount: number | '';
};

interface GoalTypeOption {
  value: GoalType;
  label: string;
  emoji: string;
}

const GOAL_TYPE_OPTIONS: GoalTypeOption[] = [
  { value: 'EmergencyFund', label: 'Emergencia', emoji: 'SOS' },
  { value: 'Savings', label: 'Poupanca', emoji: '$' },
  { value: 'Investment', label: 'Investimento', emoji: '+' },
  { value: 'Debt', label: 'Divida', emoji: '-' },
  { value: 'Travel', label: 'Viagem', emoji: '>' },
  { value: 'Custom', label: 'Personalizado', emoji: '*' },
];

const DEFAULT_COLOR = '#22c55e';

const EMPTY_FORM: GoalFormData = {
  name: '',
  description: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: undefined,
  color: DEFAULT_COLOR,
  type: 'Custom',
};

interface GoalModalProps {
  goal?: Goal;
  template?: GoalData;
  onClose: () => void;
  onSave: (data: GoalData) => Promise<void>;
}

export function GoalModal({ goal, template, onClose, onSave }: GoalModalProps) {
  const [form, setForm] = useState<GoalFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name,
        description: goal.description ?? '',
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : undefined,
        color: goal.color,
        type: goal.type,
      });
    } else if (template) {
      setForm({
        ...EMPTY_FORM,
        ...template,
        targetAmount: template.targetAmount > 0 ? template.targetAmount : '',
        currentAmount: template.currentAmount > 0 ? template.currentAmount : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [goal, template]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const goalData: GoalData = {
        ...form,
        targetAmount: Number(form.targetAmount) || 0,
        currentAmount: Number(form.currentAmount) || 0,
      };
      await onSave(goalData);
    } finally {
      setIsSaving(false);
    }
  };

  const isEditing = goal !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700 shadow-xl flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-white font-bold text-lg">
            {isEditing ? 'Editar meta' : 'Nova meta'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="overflow-y-auto flex-1 px-6 space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={100}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ex: Fundo de emergencia"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Descricao (opcional)</label>
            <input
              type="text"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Detalhes da meta"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: option.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    form.type === option.value
                      ? 'bg-green-600 border-green-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  [{option.emoji}] {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Valor objetivo (R$)</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value === '' ? '' : Number(e.target.value) })}
                required
                placeholder="Ex: 10000.00"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Ja guardado (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="0.00"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Data limite (opcional)</label>
            <input
              type="date"
              value={form.targetDate ?? ''}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value || undefined })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Cor</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-9 w-16 cursor-pointer rounded-lg border border-slate-600 bg-slate-700 p-1"
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
