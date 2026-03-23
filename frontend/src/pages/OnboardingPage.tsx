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

function StepCategory({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
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
      await createCategory(data);
      toast.success('Category created!');
      onNext();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create category.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Create your first category</h2>
        <p className="text-slate-400 text-sm">Categories help you organize your spending and income.</p>
      </div>

      <div>
        <label htmlFor="cat-name" className="block text-sm font-medium text-slate-300 mb-1">
          Category name
        </label>
        <input
          id="cat-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries"
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
        <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
          <button
            type="button"
            onClick={() => setType('Expense')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              type === 'Expense' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('Income')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              type === 'Income' ? 'bg-green-500 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="cat-color" className="block text-sm font-medium text-slate-300 mb-1">
          Color
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
          Skip this step
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
        >
          {isSaving ? 'Saving...' : 'Continue'}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

function StepFinancialSource({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinancialSourceType>('Account');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const data: FinancialSourceData = { name: name.trim(), type, closingDay: null, dueDay: null };
      await createFinancialSource(data);
      toast.success('Financial source created!');
      onNext();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create financial source.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Add a financial source</h2>
        <p className="text-slate-400 text-sm">A financial source is a bank account, credit card, or cash wallet.</p>
      </div>

      <div>
        <label htmlFor="source-name" className="block text-sm font-medium text-slate-300 mb-1">
          Source name
        </label>
        <input
          id="source-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main Checking Account"
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="source-type" className="block text-sm font-medium text-slate-300 mb-1">
          Type
        </label>
        <select
          id="source-type"
          value={type}
          onChange={(e) => setType(e.target.value as FinancialSourceType)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="Account">Checking Account</option>
          <option value="Card">Credit Card</option>
          <option value="Cash">Cash</option>
        </select>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          <SkipForward size={14} />
          Skip this step
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
        >
          {isSaving ? 'Saving...' : 'Continue'}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

function StepTransaction({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
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
      const data: Partial<TransactionData> = {
        description: description.trim(),
        totalAmount: parseFloat(amount),
        transactionType: 'Expense',
        purchaseDate: new Date(`${localDate}T12:00:00`).toISOString(),
        isInstallment: false,
        isFixed: false,
        isRecurring: false,
      };
      await createTransaction(data as TransactionData);
      toast.success('First transaction recorded!');
      onFinish();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create transaction. You can add it later from the Transactions page.'));
      onFinish();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Record your first transaction</h2>
        <p className="text-slate-400 text-sm">Add any recent expense or income to get started tracking.</p>
      </div>

      <div>
        <label htmlFor="tx-description" className="block text-sm font-medium text-slate-300 mb-1">
          Description
        </label>
        <input
          id="tx-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Coffee at the office"
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="tx-amount" className="block text-sm font-medium text-slate-300 mb-1">
          Amount (R$)
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
          Skip this step
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
        >
          {isSaving ? 'Saving...' : 'Finish setup'}
          <CheckCircle size={16} />
        </button>
      </div>
    </form>
  );
}

const STEP_LABELS = ['Create Category', 'Add Financial Source', 'First Transaction'];

export function OnboardingPage({ onFinish }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const advanceStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white text-2xl font-bold mb-2">Welcome to Piggino!</h1>
          <p className="text-slate-400 text-sm">Let's set up your account in 3 quick steps.</p>
        </div>

        <ProgressIndicator currentStep={currentStep} />

        <div className="text-center mb-6">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">
            Step {currentStep} of {TOTAL_STEPS} — {STEP_LABELS[currentStep - 1]}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
          {currentStep === 1 && (
            <StepCategory onNext={advanceStep} onSkip={advanceStep} />
          )}
          {currentStep === 2 && (
            <StepFinancialSource onNext={advanceStep} onSkip={advanceStep} />
          )}
          {currentStep === 3 && (
            <StepTransaction onFinish={onFinish} onSkip={onFinish} />
          )}
        </div>
      </div>
    </div>
  );
}
