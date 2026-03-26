import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary } from '../services/api';
import { DashboardSummary } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseDashboardOptions {
  months?: number;
  year?: number;
  month?: number;
}

interface UseDashboardResult {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard({ months = 6, year, month }: UseDashboardOptions = {}): UseDashboardResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getDashboardSummary(months, year, month);
      setSummary(data);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Não foi possível carregar o painel. Tente novamente.');
      setError(message);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [months, year, month]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, refetch: fetchSummary };
}
