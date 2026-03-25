import { useState, useEffect, useCallback } from 'react';
import { getBudgetAnalysis } from '../services/api';
import { BudgetAnalysis } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseBudgetAnalysisResult {
  analysis: BudgetAnalysis | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBudgetAnalysis(month: string): UseBudgetAnalysisResult {
  const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getBudgetAnalysis(month);
      setAnalysis(data);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Nao foi possivel carregar a analise orcamentaria.');
      setError(message);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, isLoading, error, refetch: fetchAnalysis };
}
