import { useState, useMemo } from 'react';
import { DebtItem } from '../types';

interface DebtSimulationResult {
  selectedIds: Set<number>;
  toggleDebt: (transactionId: number) => void;
  selectAll: () => void;
  clearAll: () => void;
  freedMonthlyAmount: number;
  totalSavings: number;
}

export function useDebtSimulation(debts: DebtItem[]): DebtSimulationResult {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleDebt = (transactionId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(debts.map((d) => d.transactionId)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const { freedMonthlyAmount, totalSavings } = useMemo(() => {
    const selected = debts.filter((d) => selectedIds.has(d.transactionId));
    return {
      freedMonthlyAmount: selected.reduce((sum, d) => sum + d.monthlyPayment, 0),
      totalSavings: selected.reduce((sum, d) => sum + d.totalRemaining, 0),
    };
  }, [debts, selectedIds]);

  return { selectedIds, toggleDebt, selectAll, clearAll, freedMonthlyAmount, totalSavings };
}
