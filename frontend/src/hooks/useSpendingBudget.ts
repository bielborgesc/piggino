import { useState, useEffect, useCallback } from 'react';
import {
  getSpendingBudget,
  addSpendingBudgetExpense,
  deleteSpendingBudgetExpense,
} from '../services/api';
import { SpendingBudget, SpendingBudgetExpenseCreateData } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseSpendingBudgetResult {
  budget: SpendingBudget | null;
  isLoading: boolean;
  error: string | null;
  addExpense: (data: SpendingBudgetExpenseCreateData) => Promise<void>;
  removeExpense: (expenseId: number) => Promise<void>;
  refetch: () => void;
}

export function useSpendingBudget(budgetId: number): UseSpendingBudgetResult {
  const [budget, setBudget] = useState<SpendingBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSpendingBudget(budgetId);
      setBudget(data);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Não foi possível carregar o orçamento.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const addExpense = useCallback(async (data: SpendingBudgetExpenseCreateData) => {
    await addSpendingBudgetExpense(budgetId, data);
    await fetchBudget();
  }, [budgetId, fetchBudget]);

  const removeExpense = useCallback(async (expenseId: number) => {
    await deleteSpendingBudgetExpense(budgetId, expenseId);
    await fetchBudget();
  }, [budgetId, fetchBudget]);

  return { budget, isLoading, error, addExpense, removeExpense, refetch: fetchBudget };
}
