import { useState, useEffect, useCallback } from 'react';
import { getTips } from '../services/api';
import { TipsData } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseContextualTipsResult {
  tipsData: TipsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useContextualTips(): UseContextualTipsResult {
  const [tipsData, setTipsData] = useState<TipsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTips();
      setTipsData(data);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Não foi possível carregar as dicas personalizadas.');
      setError(message);
      setTipsData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  return { tipsData, isLoading, error, refetch: fetchTips };
}
