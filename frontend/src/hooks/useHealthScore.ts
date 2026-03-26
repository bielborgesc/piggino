import { useState, useEffect, useCallback } from 'react';
import { getHealthScore } from '../services/api';
import { HealthScore } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseHealthScoreResult {
  healthScore: HealthScore | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHealthScore(): UseHealthScoreResult {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthScore = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getHealthScore();
      setHealthScore(data);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Não foi possível carregar o score de saúde financeira.');
      setError(message);
      setHealthScore(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthScore();
  }, [fetchHealthScore]);

  return { healthScore, isLoading, error, refetch: fetchHealthScore };
}
