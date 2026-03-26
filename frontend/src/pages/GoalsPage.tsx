import { useState } from 'react';
import { Target, Plus, Pencil, Trash2, LoaderCircle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGoals } from '../hooks/useGoals';
import { GoalModal } from '../components/features/goals/GoalModal';
import { Goal, GoalData, GoalType } from '../types';
import { formatBRL } from '../utils/formatters';
import { extractErrorMessage } from '../utils/errors';

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  EmergencyFund: 'Emergência',
  Savings: 'Poupança',
  Investment: 'Investimento',
  Debt: 'Dívida',
  Travel: 'Viagem',
  Custom: 'Personalizado',
};

const EMERGENCY_FUND_TEMPLATE: GoalData = {
  name: 'Fundo de Emergência',
  description: '3 a 6 vezes o salário mensal para cobrir imprevistos',
  targetAmount: 0,
  currentAmount: 0,
  color: '#f59e0b',
  type: 'EmergencyFund',
};

interface ContributionModalState {
  goalId: number;
  goalName: string;
}

function ContributionModal({
  state,
  onClose,
  onConfirm,
}: {
  state: ContributionModalState;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onConfirm(amount);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm border border-slate-700 shadow-xl">
        <h2 className="text-white font-bold text-lg mb-4">Adicionar valor</h2>
        <p className="text-slate-400 text-sm mb-4">{state.goalName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Valor (R$)</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              autoFocus
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex justify-end gap-3">
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
              {isSaving ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onContribute: (goal: Goal) => void;
}

function GoalCard({ goal, onEdit, onDelete, onContribute }: GoalCardProps) {
  const isComplete = goal.progressPercentage >= 100;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shrink-0 mt-1"
            style={{ backgroundColor: goal.color }}
          />
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">{goal.name}</h3>
            {goal.description && (
              <p className="text-slate-400 text-xs mt-0.5">{goal.description}</p>
            )}
          </div>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: `${goal.color}22`, color: goal.color }}
        >
          {GOAL_TYPE_LABELS[goal.type]}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">
            {formatBRL(goal.currentAmount)} / {formatBRL(goal.targetAmount)}
          </span>
          <span className={`font-semibold ${isComplete ? 'text-green-400' : 'text-white'}`}>
            {goal.progressPercentage}%
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${goal.progressPercentage}%`,
              backgroundColor: isComplete ? '#22c55e' : goal.color,
            }}
          />
        </div>
        {goal.monthsToGoal !== undefined && goal.monthsToGoal !== null && !isComplete && (
          <p className="text-slate-500 text-xs">
            Estimativa: {goal.monthsToGoal} {goal.monthsToGoal === 1 ? 'mês' : 'meses'} restantes
          </p>
        )}
        {isComplete && (
          <p className="text-green-400 text-xs font-semibold">Meta atingida!</p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onContribute(goal)}
          disabled={isComplete}
          className="flex-1 text-sm font-semibold py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          + Adicionar valor
        </button>
        <button
          onClick={() => onEdit(goal)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Editar meta"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(goal)}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Excluir meta"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export function GoalsPage() {
  const { goals, isLoading, error, create, update, remove, contribute } = useGoals();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [goalTemplate, setGoalTemplate] = useState<GoalData | undefined>(undefined);
  const [contributionTarget, setContributionTarget] = useState<ContributionModalState | null>(null);

  const hasEmergencyFund = goals.some((g) => g.type === 'EmergencyFund');

  const handleOpenCreate = () => {
    setEditingGoal(undefined);
    setGoalTemplate(undefined);
    setIsGoalModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTemplate(undefined);
    setIsGoalModalOpen(true);
  };

  const handleSave = async (data: GoalData) => {
    try {
      if (editingGoal) {
        await update(editingGoal.id, data);
        toast.success('Meta atualizada!');
      } else {
        await create(data);
        toast.success('Meta criada!');
      }
      setIsGoalModalOpen(false);
    } catch (saveError) {
      toast.error(extractErrorMessage(saveError, 'Erro ao salvar a meta.'));
    }
  };

  const handleDelete = async (goal: Goal) => {
    try {
      await remove(goal.id);
      toast.success('Meta excluída.');
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError, 'Erro ao excluir a meta.'));
    }
  };

  const handleContribute = (goal: Goal) => {
    setContributionTarget({ goalId: goal.id, goalName: goal.name });
  };

  const handleContributionConfirm = async (amount: number) => {
    if (!contributionTarget) return;

    try {
      await contribute(contributionTarget.goalId, { amount });
      toast.success('Valor adicionado!');
      setContributionTarget(null);
    } catch (contributeError) {
      toast.error(extractErrorMessage(contributeError, 'Erro ao adicionar valor.'));
    }
  };

  const handleOpenEmergencyFundModal = () => {
    setEditingGoal(undefined);
    setGoalTemplate(EMERGENCY_FUND_TEMPLATE);
    setIsGoalModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <LoaderCircle className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 text-slate-400">
        <AlertCircle size={40} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="text-green-400" size={24} />
            <h1 className="text-white text-xl font-bold">Minhas Metas</h1>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            Nova meta
          </button>
        </div>

        <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <Info className="text-slate-400 shrink-0 mt-0.5" size={16} />
          <p className="text-slate-400 text-xs leading-relaxed">
            Acompanhe seus objetivos financeiros aqui. Você pode adicionar valores manualmente ou vincular transações a uma meta.
            O progresso de uma meta só é atualizado quando a transação vinculada está marcada como paga.
          </p>
        </div>

        {!hasEmergencyFund && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-900/30 border border-amber-700 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-lg shrink-0">[!]</span>
              <div>
                <p className="text-amber-300 font-semibold text-sm">Crie seu fundo de emergência</p>
                <p className="text-amber-400 text-xs mt-0.5">Recomendado: 3 a 6 vezes o seu salário mensal para situações inesperadas.</p>
              </div>
            </div>
            <button
              onClick={handleOpenEmergencyFundModal}
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
            >
              Criar agora
            </button>
          </div>
        )}

        {goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Target className="text-slate-600" size={48} />
            <p className="text-slate-400 text-lg font-semibold">Nenhuma meta criada ainda</p>
            <p className="text-slate-500 text-sm">Defina objetivos financeiros e acompanhe seu progresso.</p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
            >
              Criar primeira meta
            </button>
          </div>
        )}

        {goals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onContribute={handleContribute}
              />
            ))}
          </div>
        )}
      </div>

      {isGoalModalOpen && (
        <GoalModal
          goal={editingGoal}
          template={goalTemplate}
          onClose={() => { setIsGoalModalOpen(false); setGoalTemplate(undefined); }}
          onSave={handleSave}
        />
      )}

      {contributionTarget && (
        <ContributionModal
          state={contributionTarget}
          onClose={() => setContributionTarget(null)}
          onConfirm={handleContributionConfirm}
        />
      )}
    </>
  );
}
