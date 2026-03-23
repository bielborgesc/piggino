import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getFixedBills, payFixedBill, unpayFixedBill } from '../services/api';
import { MonthlyFixedBills } from '../types';
import { extractErrorMessage } from '../utils/errors';

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
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Não foi possível carregar as contas fixas. Tente novamente.');
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchFixedBills();
  }, [fetchFixedBills]);

  const togglePaid = useCallback(async (transactionId: number, currentlyPaid: boolean) => {
    const toastId = toast.loading('Atualizando status...');
    try {
      if (currentlyPaid) {
        await unpayFixedBill(transactionId, month);
      } else {
        await payFixedBill(transactionId, month);
        toast.success('Conta marcada como paga.', { id: toastId });
      }

      if (currentlyPaid) {
        toast.success('Status atualizado.', { id: toastId });
      }

      await fetchFixedBills();
    } catch (toggleError) {
      const message = extractErrorMessage(toggleError, 'Não foi possível atualizar o status do pagamento.');
      toast.error(message, { id: toastId });
    }
  }, [month, fetchFixedBills]);

  return { data, isLoading, error, togglePaid, refetch: fetchFixedBills };
}
