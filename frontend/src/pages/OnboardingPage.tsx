import { useState } from 'react';
import { CheckCircle, ArrowRight, SkipForward } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCategory, createFinancialSource, createTransaction } from '../services/api';
import { CategoryData, CategoryType, FinancialSourceData, FinancialSourceType, TransactionData } from '../types';
import { extractErrorMessage } from '../utils/errors';

const TOTAL_STEPS = 3;

interface OnboardingPageProps {
  onFinish: () => void;
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={stepNumber} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                isCompleted
                  ? 'bg-green-600 text-white'
                  : isActive
                  ? 'bg-slate-600 border-2 border-green-500 text-white'
                  : 'bg-slate-700 text-slate-500'
              }`}
            >
              {isCompleted ? <CheckCircle size={16} /> : stepNumber}
            </div>
            {index < TOTAL_STEPS - 1 && (
              <div className={`w-12 h-0.5 ${stepNumber < currentStep ? 'bg-green-600' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCategory({ onNext, onSkip }: { onNext: (categoryId: number) => void; onSkip: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('Expense');
  const [color, setColor] = useState('#22c55e');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const data: CategoryData = { name: name.trim(), type, color, budgetBucket: 'None' };
      const created = await createCategory(data);
      toast.success('Categoria criada!');
      onNext(created.id);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Nao foi possivel criar a categoria.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Crie sua primeira categoria</h2>
        <p className="text-slate-400 text-sm">Categorias ajudam a organizar seus gastos e receitas.</p>
      </div>

      <div>
        <label htmlFor="cat-name" className="block text-sm font-medium text-slate-300 mb-1">
          Nome da categoria
        </label>
        <input
          id="cat-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Supermercado"
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
        <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
          <button
            type="button"
            onClick={() => setType('Expense')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              type === 'Expense' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('Income')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              type === 'Income' ? 'bg-green-500 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            Receita
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="cat-color" className="block text-sm font-medium text-slate-300 mb-1">
          Cor
        </label>
        <div className="flex items-center gap-3">
          <input
            id="cat-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer p-1"
          />
          <span
            className="inline-block w-6 h-6 rounded-full border border-slate-600 shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-slate-400 text-sm font-mono">{color}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          <SkipForward size={14} />
          Pular esta etapa
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
        >
          {isSaving ? 'Salvando...' : 'Continuar'}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

function StepFinancialSource({ onNext, onSkip }: { onNext: (financialSourceId: number) => void; onSkip: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinancialSourceType>('Account');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const data: FinancialSourceData = { name: name.trim(), type, closingDay: null, dueDay: null };
      const created = await createFinancialSource(data);
      toast.success('Fonte financeira criada!');
      onNext(created.id);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Nao foi possivel criar a fonte financeira.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Adicione uma fonte financeira</h2>
        <p className="text-slate-400 text-sm">Uma fonte financeira e uma conta bancaria, cartao de credito ou carteira.</p>
      </div>

      <div>
        <label htmlFor="source-name" className="block text-sm font-medium text-slate-300 mb-1">
          Nome da fonte
        </label>
        <input
          id="source-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Conta Corrente Principal"
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="source-type" className="block text-sm font-medium text-slate-300 mb-1">
          Tipo
        </label>
        <select
          id="source-type"
          value={type}
          onChange={(e) => setType(e.target.value as FinancialSourceType)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="Account">Conta Corrente</option>
          <option value="Card">Cartao de Credito</option>
          <option value="Cash">Dinheiro</option>
        </select>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          <SkipForward size={14} />
          Pular esta etapa
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
        >
          {isSaving ? 'Salvando...' : 'Continuar'}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

interface StepTransactionProps {
  categoryId: number | null;
  financialSourceId: number | null;
  onFinish: () => void;
  onSkip: () => void;
}

function StepTransaction({ categoryId, financialSourceId, onFinish, onSkip }: StepTransactionProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!description.trim() || !amount) return;

    setIsSaving(true);
    try {
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const data: TransactionData = {
        description: description.trim(),
        totalAmount: parseFloat(amount),
        transactionType: 'Expense',
        categoryId: categoryId ?? 0,
        financialSourceId: financialSourceId ?? 0,
        purchaseDate: new Date(`${localDate}T12:00:00`).toISOString(),
        isInstallment: false,
        isFixed: false,
        isRecurring: false,
      };
      await createTransaction(data);
      toast.success('Primeira transacao registrada!');
      onFinish();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Nao foi possivel criar a transacao. Voce pode adicioná-la depois na pagina de Transacoes.'));
      onFinish();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Registre sua primeira transacao</h2>
        <p className="text-slate-400 text-sm">Adicione qualquer despesa ou receita recente para comecar a acompanhar.</p>
      </div>

      <div>
        <label htmlFor="tx-description" className="block text-sm font-medium text-slate-300 mb-1">
          Descricao
        </label>
        <input
          id="tx-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Cafe no escritorio"
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="tx-amount" className="block text-sm font-medium text-slate-300 mb-1">
          Valor (R$)
        </label>
        <input
          id="tx-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          <SkipForward size={14} />
          Pular esta etapa
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
        >
          {isSaving ? 'Salvando...' : 'Concluir configuracao'}
          <CheckCircle size={16} />
        </button>
      </div>
    </form>
  );
}

const STEP_LABELS = ['Criar Categoria', 'Adicionar Fonte Financeira', 'Primeira Transacao'];

export function OnboardingPage({ onFinish }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [createdCategoryId, setCreatedCategoryId] = useState<number | null>(null);
  const [createdFinancialSourceId, setCreatedFinancialSourceId] = useState<number | null>(null);

  const handleCategoryNext = (categoryId: number) => {
    setCreatedCategoryId(categoryId);
    setCurrentStep(2);
  };

  const handleFinancialSourceNext = (financialSourceId: number) => {
    setCreatedFinancialSourceId(financialSourceId);
    setCurrentStep(3);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white text-2xl font-bold mb-2">Bem-vindo ao Piggino!</h1>
          <p className="text-slate-400 text-sm">Vamos configurar sua conta em 3 passos rapidos.</p>
        </div>

        <ProgressIndicator currentStep={currentStep} />

        <div className="text-center mb-6">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">
            Etapa {currentStep} de {TOTAL_STEPS} — {STEP_LABELS[currentStep - 1]}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
          {currentStep === 1 && (
            <StepCategory onNext={handleCategoryNext} onSkip={() => setCurrentStep(2)} />
          )}
          {currentStep === 2 && (
            <StepFinancialSource onNext={handleFinancialSourceNext} onSkip={() => setCurrentStep(3)} />
          )}
          {currentStep === 3 && (
            <StepTransaction
              categoryId={createdCategoryId}
              financialSourceId={createdFinancialSourceId}
              onFinish={onFinish}
              onSkip={onFinish}
            />
          )}
        </div>
      </div>
    </div>
  );
}
