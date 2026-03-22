import { useState, useEffect, useCallback } from 'react';
import { getInvoice } from '../services/api';
import { Invoice } from '../types';

interface UseInvoiceResult {
  invoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInvoice(financialSourceId: number | null, month: string): UseInvoiceResult {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (financialSourceId === null) {
      setInvoice(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getInvoice(financialSourceId, month);
      setInvoice(data);
    } catch {
      setError('Failed to load the invoice. Please try again.');
      setInvoice(null);
    } finally {
      setIsLoading(false);
    }
  }, [financialSourceId, month]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return { invoice, isLoading, error, refetch: fetchInvoice };
}
