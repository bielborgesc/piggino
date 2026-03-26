import { useState, useEffect, useCallback } from 'react';
import { getTitheStatus, toggleTitheModule, generateMonthlyTithe } from '../services/api';
import { TitheStatus } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseTitheModuleResult {
  status: TitheStatus | null;
  isLoading: boolean;
  isToggling: boolean;
  isGenerating: boolean;
  error: string | null;
  toggle: (enabled: boolean) => Promise<void>;
  generate: () => Promise<void>;
  refetch: () => void;
}

export function useTitheModule(): UseTitheModuleResult {
  const [status, setStatus] = useState<TitheStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTitheStatus();
      setStatus(data);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Não foi possível carregar o módulo dízimo.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggle = useCallback(async (enabled: boolean) => {
    setIsToggling(true);
    try {
      await toggleTitheModule(enabled);
      setStatus((prev) => prev ? { ...prev, isEnabled: enabled } : prev);
    } catch (toggleError) {
      const message = extractErrorMessage(toggleError, 'Erro ao alterar módulo dízimo.');
      setError(message);
      throw toggleError;
    } finally {
      setIsToggling(false);
    }
  }, []);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generateMonthlyTithe();
      await fetchStatus();
    } catch (generateError) {
      const message = extractErrorMessage(generateError, 'Erro ao gerar transação de dízimo.');
      setError(message);
      throw generateError;
    } finally {
      setIsGenerating(false);
    }
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    isToggling,
    isGenerating,
    error,
    toggle,
    generate,
    refetch: fetchStatus,
  };
}
