import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getFixedBills, payFixedBill, unpayFixedBill } from '../services/api';
import { MonthlyFixedBills, FixedBill } from '../types';
import { extractErrorMessage } from '../utils/errors';

interface UseFixedBillsResult {
  data: MonthlyFixedBills | null;
  isLoading: boolean;
  error: string | null;
  togglePaid: (transactionId: number, currentlyPaid: boolean) => Promise<void>;
  refetch: () => void;
}

function applyOptimisticToggle(previous: MonthlyFixedBills, transactionId: number, newIsPaid: boolean): MonthlyFixedBills {
  const updatedItems = previous.items.map((bill: FixedBill) =>
    bill.transactionId === transactionId ? { ...bill, isPaid: newIsPaid } : bill
  );

  const paidAmount = updatedItems.filter((b) => b.isPaid).reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingAmount = previous.totalAmount - paidAmount;

  return { ...previous, items: updatedItems, paidAmount, pendingAmount };
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

  const silentRefetch = useCallback(async () => {
    try {
      const result = await getFixedBills(month);
      setData(result);
    } catch {
      // silently ignore — optimistic state remains visible
    }
  }, [month]);

  useEffect(() => {
    fetchFixedBills();
  }, [fetchFixedBills]);

  const togglePaid = useCallback(async (transactionId: number, currentlyPaid: boolean) => {
    const toastId = toast.loading('Atualizando status...');
    const newIsPaid = !currentlyPaid;

    setData((previous) => {
      if (!previous) return previous;
      return applyOptimisticToggle(previous, transactionId, newIsPaid);
    });

    try {
      if (currentlyPaid) {
        await unpayFixedBill(transactionId, month);
      } else {
        await payFixedBill(transactionId, month);
      }

      const successMessage = currentlyPaid ? 'Pagamento removido.' : 'Conta marcada como paga.';
      toast.success(successMessage, { id: toastId });

      silentRefetch();
    } catch (toggleError) {
      setData((previous) => {
        if (!previous) return previous;
        return applyOptimisticToggle(previous, transactionId, currentlyPaid);
      });

      const message = extractErrorMessage(toggleError, 'Não foi possível atualizar o status do pagamento.');
      toast.error(message, { id: toastId });
    }
  }, [month, silentRefetch]);

  return { data, isLoading, error, togglePaid, refetch: fetchFixedBills };
}
