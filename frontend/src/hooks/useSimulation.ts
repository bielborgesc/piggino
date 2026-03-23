import { useState, useEffect, useCallback } from 'react';
import { getSimulation } from '../services/api';
import { Simulation } from '../types';

interface UseSimulationResult {
  simulation: Simulation | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSimulation(): UseSimulationResult {
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSimulation();
      setSimulation(data);
    } catch {
      setError('Nao foi possivel carregar a simulacao. Tente novamente.');
      setSimulation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSimulation();
  }, [fetchSimulation]);

  return { simulation, isLoading, error, refetch: fetchSimulation };
}
