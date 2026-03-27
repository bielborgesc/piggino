import { useState, useEffect, useCallback } from 'react';
import {
  getSpendingBudgets,
  createSpendingBudget,
  deleteSpendingBudget,
} from '../services/api';
import { SpendingBudget, SpendingBudgetCreateData } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseSpendingBudgetsResult {
  budgets: SpendingBudget[];
  isLoading: boolean;
  error: string | null;
  create: (data: SpendingBudgetCreateData) => Promise<void>;
  remove: (id: number) => Promise<void>;
  refetch: () => void;
}

export function useSpendingBudgets(): UseSpendingBudgetsResult {
  const [budgets, setBudgets] = useState<SpendingBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSpendingBudgets();
      setBudgets(data);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Não foi possível carregar os orçamentos.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const create = useCallback(async (data: SpendingBudgetCreateData) => {
    await createSpendingBudget(data);
    await fetchBudgets();
  }, [fetchBudgets]);

  const remove = useCallback(async (id: number) => {
    await deleteSpendingBudget(id);
    await fetchBudgets();
  }, [fetchBudgets]);

  return { budgets, isLoading, error, create, remove, refetch: fetchBudgets };
}
