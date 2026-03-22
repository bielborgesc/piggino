import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary } from '../services/api';
import { DashboardSummary } from '../types';

interface UseDashboardResult {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(months = 6): UseDashboardResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getDashboardSummary(months);
      setSummary(data);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, refetch: fetchSummary };
}
