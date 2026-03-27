import { useState } from 'react';
import { BookOpen, Plus, Trash2, LoaderCircle, AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSpendingBudgets } from '../hooks/useSpendingBudgets';
import { useSpendingBudget } from '../hooks/useSpendingBudget';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SpendingBudget, SpendingBudgetCreateData, SpendingBudgetExpense, SpendingBudgetExpenseCreateData } from '../types';
import { formatBRL } from '../utils/formatters';
import { extractErrorMessage } from '../utils/errors';
import { addSpendingBudgetExpense } from '../services/api';

const PROGRESS_BAR_MAX_PERCENT = 100;

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), PROGRESS_BAR_MAX_PERCENT);
}

function calculateProgressPercent(spent: number, total: number): number {
  if (total <= 0) return 0;
  return clampPercent((spent / total) * PROGRESS_BAR_MAX_PERCENT);
}

// --- Create Budget Modal ---

interface CreateBudgetModalProps {
  onClose: () => void;
  onSave: (data: SpendingBudgetCreateData) => Promise<void>;
}

function CreateBudgetModal({ onClose, onSave }: CreateBudgetModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ name, description: description || undefined, totalAmount });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-xl w-full max-w-sm border border-slate-700 shadow-xl flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 px-6 pt-6 pb-4">
          <h2 className="text-white font-bold text-lg mb-4">Novo Orçamento</h2>
          <form id="create-budget-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="Ex: Viagem Floripa"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Gastos da viagem de janeiro"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Valor total (R$)</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </form>
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
            form="create-budget-form"
            disabled={isSaving}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isSaving ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Add Expense Modal ---

interface AddExpenseModalProps {
  budgetName: string;
  onClose: () => void;
  onSave: (data: SpendingBudgetExpenseCreateData) => Promise<void>;
}

function AddExpenseModal({ budgetName, onClose, onSave }: AddExpenseModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(today);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ description, amount, date });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-xl w-full max-w-sm border border-slate-700 shadow-xl flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 px-6 pt-6 pb-4">
          <h2 className="text-white font-bold text-lg mb-1">Registrar Gasto</h2>
          <p className="text-slate-400 text-sm mb-4">{budgetName}</p>
          <form id="add-expense-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                autoFocus
                placeholder="Ex: Passagem de ônibus"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Valor (R$)</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </form>
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
            form="add-expense-form"
            disabled={isSaving}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Quick Add Expense Form (inline in card) ---

interface QuickAddExpenseFormProps {
  budgetId: number;
  onSuccess: () => void;
}

function QuickAddExpenseForm({ budgetId, onSuccess }: QuickAddExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!description.trim() || !amount) return;

    const today = new Date().toISOString().split('T')[0];
    setIsSubmitting(true);
    try {
      await addSpendingBudgetExpense(budgetId, {
        description: description.trim(),
        amount: Number(amount),
        date: today,
      });
      setDescription('');
      setAmount('');
      onSuccess();
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, 'Erro ao registrar gasto.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição"
        required
        className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Valor"
        min={0.01}
        step="0.01"
        required
        className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="shrink-0 flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg p-1.5 transition-colors"
        aria-label="Adicionar gasto"
      >
        <Plus size={14} />
      </button>
    </form>
  );
}

// --- Budget Card (list view) ---

interface BudgetCardProps {
  budget: SpendingBudget;
  onOpen: (budget: SpendingBudget) => void;
  onDelete: (budget: SpendingBudget) => void;
  onExpenseAdded: () => void;
}

function BudgetCard({ budget, onOpen, onDelete, onExpenseAdded }: BudgetCardProps) {
  const percent = calculateProgressPercent(budget.spentAmount, budget.totalAmount);
  const isOverBudget = budget.spentAmount > budget.totalAmount;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-base leading-tight">{budget.name}</h3>
          {budget.description && (
            <p className="text-slate-400 text-xs mt-0.5">{budget.description}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(budget); }}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
          aria-label="Excluir orçamento"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">
            {formatBRL(budget.spentAmount)} / {formatBRL(budget.totalAmount)}
          </span>
          <span className={`font-semibold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
            {percent.toFixed(0)}%
          </span>
        </div>
        <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className={`text-xs ${isOverBudget ? 'text-red-400' : 'text-slate-400'}`}>
          {isOverBudget
            ? `Acima do orçamento: ${formatBRL(Math.abs(budget.remainingAmount))}`
            : `Restante: ${formatBRL(budget.remainingAmount)}`}
        </p>
      </div>

      <QuickAddExpenseForm budgetId={budget.id} onSuccess={onExpenseAdded} />

      <button
        onClick={() => onOpen(budget)}
        className="flex items-center justify-between w-full text-sm text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
      >
        <span>Ver detalhes ({budget.expenses.length} gastos)</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// --- Expense Row ---

const PERCENTAGE_DECIMAL_PLACES = 1;

function calculateExpensePercent(expenseAmount: number, budgetTotalAmount: number): string {
  if (budgetTotalAmount <= 0) return '0.0';
  return ((expenseAmount / budgetTotalAmount) * 100).toFixed(PERCENTAGE_DECIMAL_PLACES);
}

interface ExpenseRowProps {
  expense: SpendingBudgetExpense;
  budgetTotalAmount: number;
  onDelete: (expense: SpendingBudgetExpense) => void;
}

function ExpenseRow({ expense, budgetTotalAmount, onDelete }: ExpenseRowProps) {
  const formattedDate = new Date(expense.date).toLocaleDateString('pt-BR');
  const expensePercent = calculateExpensePercent(expense.amount, budgetTotalAmount);

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0">
      <div className="flex flex-col">
        <span className="text-white text-sm font-medium">{expense.description}</span>
        <span className="text-slate-500 text-xs">{formattedDate}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-slate-200 text-sm font-semibold">{formatBRL(expense.amount)}</span>
          <span className="text-slate-500 text-xs">{expensePercent}%</span>
        </div>
        <button
          onClick={() => onDelete(expense)}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Excluir gasto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// --- Budget Detail View ---

interface BudgetDetailProps {
  budgetId: number;
  onBack: () => void;
  onExpenseMutated: () => void;
}

function BudgetDetail({ budgetId, onBack, onExpenseMutated }: BudgetDetailProps) {
  const { budget, isLoading, error, addExpense, removeExpense } = useSpendingBudget(budgetId);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<SpendingBudgetExpense | null>(null);

  const handleAddExpense = async (data: SpendingBudgetExpenseCreateData) => {
    try {
      await addExpense(data);
      onExpenseMutated();
      toast.success('Gasto registrado!');
      setIsAddExpenseOpen(false);
    } catch (addError) {
      toast.error(extractErrorMessage(addError, 'Erro ao registrar gasto.'));
    }
  };

  const handleDeleteExpenseConfirm = async () => {
    if (!deleteExpenseTarget) return;
    const target = deleteExpenseTarget;
    setDeleteExpenseTarget(null);

    try {
      await removeExpense(target.id);
      onExpenseMutated();
      toast.success('Gasto removido.');
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError, 'Erro ao remover gasto.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <LoaderCircle className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 text-slate-400">
        <AlertCircle size={40} />
        <p>{error ?? 'Orçamento não encontrado.'}</p>
      </div>
    );
  }

  const percent = calculateProgressPercent(budget.spentAmount, budget.totalAmount);
  const isOverBudget = budget.spentAmount > budget.totalAmount;

  return (
    <>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">{budget.name}</h1>
            {budget.description && (
              <p className="text-slate-400 text-sm">{budget.description}</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-xs mb-1">Total</p>
              <p className="text-white font-bold">{formatBRL(budget.totalAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Gasto</p>
              <p className={`font-bold ${isOverBudget ? 'text-red-400' : 'text-orange-400'}`}>
                {formatBRL(budget.spentAmount)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">{isOverBudget ? 'Excesso' : 'Restante'}</p>
              <p className={`font-bold ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                {formatBRL(Math.abs(budget.remainingAmount))}
              </p>
            </div>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs text-center">{percent.toFixed(1)}% utilizado</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Gastos</h2>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors"
            >
              <Plus size={14} />
              Novo gasto
            </button>
          </div>

          {budget.expenses.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-6">Nenhum gasto registrado ainda.</p>
          )}

          {budget.expenses.length > 0 && (
            <div>
              {[...budget.expenses]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    budgetTotalAmount={budget.totalAmount}
                    onDelete={setDeleteExpenseTarget}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {isAddExpenseOpen && (
        <AddExpenseModal
          budgetName={budget.name}
          onClose={() => setIsAddExpenseOpen(false)}
          onSave={handleAddExpense}
        />
      )}

      <ConfirmModal
        isOpen={deleteExpenseTarget !== null}
        title="Remover Gasto"
        message={`Tem certeza que deseja remover "${deleteExpenseTarget?.description}"?`}
        confirmLabel="Remover"
        confirmVariant="danger"
        onConfirm={handleDeleteExpenseConfirm}
        onCancel={() => setDeleteExpenseTarget(null)}
      />
    </>
  );
}

// --- Main BudgetsPage ---

export function BudgetsPage() {
  const { budgets, isLoading, error, create, remove, refetch } = useSpendingBudgets();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpendingBudget | null>(null);

  const handleCreate = async (data: SpendingBudgetCreateData) => {
    try {
      await create(data);
      toast.success('Orçamento criado!');
      setIsCreateOpen(false);
    } catch (createError) {
      toast.error(extractErrorMessage(createError, 'Erro ao criar orçamento.'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    if (selectedBudgetId === target.id) {
      setSelectedBudgetId(null);
    }

    try {
      await remove(target.id);
      toast.success('Orçamento excluído.');
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError, 'Erro ao excluir orçamento.'));
    }
  };

  if (selectedBudgetId !== null) {
    return (
      <BudgetDetail
        budgetId={selectedBudgetId}
        onBack={() => setSelectedBudgetId(null)}
        onExpenseMutated={refetch}
      />
    );
  }

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
            <BookOpen className="text-green-400" size={24} />
            <h1 className="text-white text-xl font-bold">Orçamentos</h1>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            Novo
          </button>
        </div>

        {budgets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <BookOpen className="text-slate-600" size={48} />
            <p className="text-slate-400 text-lg font-semibold">Nenhum orçamento criado</p>
            <p className="text-slate-500 text-sm">Crie um "caderninho de gastos" para controlar despesas de uma viagem, evento ou projeto.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
            >
              Criar primeiro orçamento
            </button>
          </div>
        )}

        {budgets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onOpen={(b) => setSelectedBudgetId(b.id)}
                onDelete={setDeleteTarget}
                onExpenseAdded={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateBudgetModal
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreate}
        />
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Excluir Orçamento"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todos os gastos registrados serão removidos.`}
        confirmLabel="Excluir"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
