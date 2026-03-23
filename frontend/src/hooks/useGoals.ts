import { useState, useEffect, useCallback } from 'react';
import { getGoals, createGoal, updateGoal, deleteGoal, addContribution } from '../services/api';
import { Goal, GoalData, AddContributionData } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseGoalsResult {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  create: (data: GoalData) => Promise<void>;
  update: (id: number, data: GoalData) => Promise<void>;
  remove: (id: number) => Promise<void>;
  contribute: (id: number, data: AddContributionData) => Promise<void>;
  refetch: () => void;
}

export function useGoals(): UseGoalsResult {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getGoals();
      setGoals(data);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Nao foi possivel carregar as metas.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const create = useCallback(async (data: GoalData) => {
    await createGoal(data);
    await fetchGoals();
  }, [fetchGoals]);

  const update = useCallback(async (id: number, data: GoalData) => {
    await updateGoal(id, data);
    await fetchGoals();
  }, [fetchGoals]);

  const remove = useCallback(async (id: number) => {
    await deleteGoal(id);
    await fetchGoals();
  }, [fetchGoals]);

  const contribute = useCallback(async (id: number, data: AddContributionData) => {
    await addContribution(id, data);
    await fetchGoals();
  }, [fetchGoals]);

  return { goals, isLoading, error, create, update, remove, contribute, refetch: fetchGoals };
}
