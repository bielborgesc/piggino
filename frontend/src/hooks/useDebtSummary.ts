import { useState, useEffect, useCallback } from 'react';
import { getDebtSummary } from '../services/api';
import { DebtSummary } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseDebtSummaryResult {
  debtSummary: DebtSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDebtSummary(): UseDebtSummaryResult {
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebtSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getDebtSummary();
      setDebtSummary(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Nao foi possivel carregar o resumo de dividas.'));
      setDebtSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebtSummary();
  }, [fetchDebtSummary]);

  return { debtSummary, isLoading, error, refetch: fetchDebtSummary };
}
