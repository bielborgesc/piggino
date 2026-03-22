import { useState, useEffect, useCallback } from 'react';
import { getFixedBills, payFixedBill, unpayFixedBill } from '../services/api';
import { MonthlyFixedBills } from '../types';

interface UseFixedBillsResult {
  data: MonthlyFixedBills | null;
  isLoading: boolean;
  error: string | null;
  togglePaid: (transactionId: number, currentlyPaid: boolean) => Promise<void>;
  refetch: () => void;
}

export function useFixedBills(month: string): UseFixedBillsResult {
  const [data, setData] = useState<MonthlyFixedBills | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFixedBills = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getFixedBills(month);
      setData(result);
    } catch {
      setError('Failed to load fixed bills. Please try again.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchFixedBills();
  }, [fetchFixedBills]);

  const togglePaid = useCallback(async (transactionId: number, currentlyPaid: boolean) => {
    try {
      if (currentlyPaid) {
        await unpayFixedBill(transactionId, month);
      } else {
        await payFixedBill(transactionId, month);
      }
      await fetchFixedBills();
    } catch {
      setError('Failed to update payment status. Please try again.');
    }
  }, [month, fetchFixedBills]);

  return { data, isLoading, error, togglePaid, refetch: fetchFixedBills };
}
