import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlusCircle, Search, LoaderCircle, Edit, Trash2, CheckCircle, XCircle, RefreshCw, CreditCard, ArrowRightLeft } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { TransactionModal } from '../components/features/transactions/TransactionModal';
import { InstallmentBreakdown } from '../components/features/transactions/InstallmentBreakdown';
import { RecurrenceScopeModal } from '../components/features/transactions/RecurrenceScopeModal';
import { FixedBillScopeModal } from '../components/features/transactions/FixedBillScopeModal';
import { FixedBillEditModal } from '../components/features/transactions/FixedBillEditModal';
import { MonthNavigator } from '../components/ui/MonthNavigator';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { getTransactions, getTransactionById, deleteTransaction, deleteInstallmentsByScope, getCategories, getFinancialSources, toggleInstallmentPaidStatus, toggleTransactionPaidStatus, settleInstallments, payFixedBill, unpayFixedBill, deleteFixedBillScoped, updateFixedBillScoped } from '../services/api';
import { Transaction, Category, FinancialSource, RecurrenceScope, FixedBillScope, FixedBillUpdateData, FixedBill } from '../types';
import { formatBRL } from '../utils/formatters';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../utils/errors';

const TRANSACTIONS_MONTH_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'long',
  timeZone: 'UTC',
};

function isCardTransaction(item: Transaction): boolean {
  return item.financialSourceType === 'Card';
}

function renderAmountCell(item: Transaction & { displayAmount: number }): React.ReactNode {
  const sign = item.transactionType.toLowerCase() === 'income' ? '+' : '-';
  const amount = item.totalAmount;
  const formattedAmount = formatBRL(Math.abs(amount));

  if (item.isInstallment && item.currentInstallmentNumber !== undefined && item.installmentCount) {
    return (
      <>
        {sign} {formattedAmount}{' '}
        <span className="text-xs font-normal opacity-70">
          ({item.currentInstallmentNumber}/{item.installmentCount})
        </span>
      </>
    );
  }

  return <>{sign} {formattedAmount}</>;
}

export function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [expandedInstallmentRowId, setExpandedInstallmentRowId] = useState<string | null>(null);

  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [scopeModalAction, setScopeModalAction] = useState<'edit' | 'delete'>('edit');
  const [pendingScopeItem, setPendingScopeItem] = useState<Transaction | null>(null);
  const [pendingEditScope, setPendingEditScope] = useState<RecurrenceScope | undefined>(undefined);

  const [isInstallmentScopeModalOpen, setIsInstallmentScopeModalOpen] = useState(false);
  const [installmentScopeModalAction, setInstallmentScopeModalAction] = useState<'edit' | 'delete'>('edit');
  const [pendingInstallmentItem, setPendingInstallmentItem] = useState<Transaction | null>(null);
  const [pendingInstallmentEditScope, setPendingInstallmentEditScope] = useState<RecurrenceScope | undefined>(undefined);
  const [pendingInstallmentNumber, setPendingInstallmentNumber] = useState<number | undefined>(undefined);

  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [settleConfirmId, setSettleConfirmId] = useState<number | null>(null);
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<Transaction | null>(null);

  const [isFixedBillScopeModalOpen, setIsFixedBillScopeModalOpen] = useState(false);
  const [fixedBillScopeModalAction, setFixedBillScopeModalAction] = useState<'edit' | 'delete'>('delete');
  const [pendingFixedBillItem, setPendingFixedBillItem] = useState<Transaction | null>(null);

  const [isFixedBillEditModalOpen, setIsFixedBillEditModalOpen] = useState(false);
  const [fixedBillEditTarget, setFixedBillEditTarget] = useState<FixedBill | null>(null);
  const [fixedBillEditScope, setFixedBillEditScope] = useState<FixedBillScope>('All');
  const [fixedBillEditAnchorMonth, setFixedBillEditAnchorMonth] = useState<string>('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [financialSources, setFinancialSources] = useState<FinancialSource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');

  const fetchPageData = useCallback(async () => {
    try {
      const [transactionsData, categoriesData, sourcesData] = await Promise.all([
        getTransactions(),
        getCategories(),
        getFinancialSources(),
      ]);

      setAllTransactions(transactionsData);
      setCategories(categoriesData);
      setFinancialSources(sourcesData);
    } catch (fetchError) {
      const message = extractErrorMessage(fetchError, 'Não foi possível carregar os dados da página.');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPageData();
  }, [fetchPageData]);

  const handlePreviousMonth = () => setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)));
  const handleNextMonth = () => setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)));

  const monthlyItems = useMemo(() => {
    const items = allTransactions.filter(t => {
      const date = new Date(t.purchaseDate);
      const viewYear = currentDate.getUTCFullYear();
      const viewMonth = currentDate.getUTCMonth();
      return date.getUTCFullYear() === viewYear && date.getUTCMonth() === viewMonth;
    }).map(t => ({
      ...t,
      displayAmount: t.totalAmount,
      syntheticId: `${t.id}-${t.purchaseDate}`,
    }));

    let filteredItems = items;

    if (filterType !== 'all') {
      filteredItems = filteredItems.filter(item => item.transactionType.toLowerCase() === filterType.toLowerCase());
    }

    if (selectedCategory) {
      filteredItems = filteredItems.filter(item => String(item.categoryId) === selectedCategory);
    }

    if (selectedSource) {
      filteredItems = filteredItems.filter(item => String(item.financialSourceId) === selectedSource);
    }

    if (searchQuery) {
      filteredItems = filteredItems.filter(item =>
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredItems;
  }, [currentDate, filterType, allTransactions, searchQuery, selectedCategory, selectedSource]);

  const summary = useMemo(() => {
    const expenses = monthlyItems.filter(item => item.transactionType === 'Expense');
    const paidAmount = expenses.filter(item => item.isPaid).reduce((acc, item) => acc + item.displayAmount, 0);
    const pendingAmount = expenses.filter(item => !item.isPaid).reduce((acc, item) => acc + item.displayAmount, 0);
    const totalAmount = paidAmount + pendingAmount;
    return { totalAmount, paidAmount, pendingAmount };
  }, [monthlyItems]);

  const buildMonthParam = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const resolveInstallmentId = (transactionId: number, installmentNumber: number): number | null => {
    const parent = allTransactions.find(t => t.id === transactionId);
    if (!parent?.cardInstallments) return null;
    const installment = parent.cardInstallments.find(i => i.installmentNumber === installmentNumber);
    return installment?.id ?? null;
  };

  const handleTogglePaid = async (item: Transaction & { displayAmount: number; syntheticId?: string }) => {
    if (isCardTransaction(item)) {
      toast('Parcelas de cartão são pagas na tela Fatura.', { icon: '💳' });
      return;
    }

    const isAccountInstallmentRow = item.isInstallment &&
      item.currentInstallmentNumber !== undefined &&
      item.financialSourceType !== 'Card';

    if (isAccountInstallmentRow) {
      const installmentId = resolveInstallmentId(item.id, item.currentInstallmentNumber!);
      if (!installmentId) {
        toast.error('Não foi possível identificar a parcela.');
        return;
      }
      const toastId = toast.loading('Atualizando status...');
      try {
        await toggleInstallmentPaidStatus(installmentId);
        toast.success('Status atualizado!', { id: toastId });
        getTransactions().then(data => setAllTransactions(data)).catch(() => {});
      } catch (toggleError) {
        const message = extractErrorMessage(toggleError, 'Não foi possível atualizar o status.');
        toast.error(message, { id: toastId });
      }
      return;
    }

    const toastId = toast.loading('Atualizando status...');

    setAllTransactions(prev =>
      prev.map(t =>
        t.id === item.id && t.purchaseDate === item.purchaseDate
          ? { ...t, isPaid: !item.isPaid }
          : t
      )
    );

    try {
      if (item.isFixed) {
        const monthParam = buildMonthParam(currentDate);
        if (item.isPaid) {
          await unpayFixedBill(item.id, monthParam);
        } else {
          await payFixedBill(item.id, monthParam);
        }
      } else {
        await toggleTransactionPaidStatus(item.id);
      }
      toast.success('Status atualizado!', { id: toastId });
      getTransactions().then(data => setAllTransactions(data)).catch(() => {});
    } catch (toggleError) {
      setAllTransactions(prev =>
        prev.map(t =>
          t.id === item.id && t.purchaseDate === item.purchaseDate
            ? { ...t, isPaid: item.isPaid }
            : t
        )
      );
      const message = extractErrorMessage(toggleError, 'Não foi possível atualizar o status.');
      toast.error(message, { id: toastId });
    }
  };

  const resolveOriginalTransaction = (item: Transaction): Transaction => {
    const original = allTransactions.find(t => t.id === item.id);
    return original ?? item;
  };

  const handleOpenModal = (item: Transaction | null) => {
    if (item === null) {
      setEditingTransaction(null);
      setIsModalOpen(true);
      return;
    }

    if (item.isInstallment && item.currentInstallmentNumber !== undefined) {
      setPendingInstallmentItem(item);
      setInstallmentScopeModalAction('edit');
      setIsInstallmentScopeModalOpen(true);
      return;
    }

    const original = resolveOriginalTransaction(item);

    if (original.isFixed) {
      setPendingFixedBillItem(original);
      setFixedBillScopeModalAction('edit');
      setIsFixedBillScopeModalOpen(true);
      return;
    }

    if (original.isRecurring) {
      setPendingScopeItem(original);
      setScopeModalAction('edit');
      setIsScopeModalOpen(true);
      return;
    }

    setEditingTransaction(original);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setPendingEditScope(undefined);
    setPendingInstallmentEditScope(undefined);
    setPendingInstallmentNumber(undefined);
    fetchPageData();
  };

  const handleDelete = (item: Transaction) => {
    if (item.isInstallment && item.currentInstallmentNumber !== undefined) {
      setPendingInstallmentItem(item);
      setInstallmentScopeModalAction('delete');
      setIsInstallmentScopeModalOpen(true);
      return;
    }

    const original = resolveOriginalTransaction(item);

    if (original.isFixed) {
      setPendingFixedBillItem(original);
      setFixedBillScopeModalAction('delete');
      setIsFixedBillScopeModalOpen(true);
      return;
    }

    if (original.isRecurring) {
      setPendingScopeItem(original);
      setScopeModalAction('delete');
      setIsScopeModalOpen(true);
      return;
    }

    setDeleteConfirmTransaction(original);
  };

  const executeDelete = async (id: number, scope: RecurrenceScope) => {
    const toastId = toast.loading('Excluindo...');
    try {
      await deleteTransaction(id, scope);
      toast.success('Transação excluída!', { id: toastId });
      fetchPageData();
    } catch (deleteError) {
      const message = extractErrorMessage(deleteError, 'Falha ao excluir a transação.');
      toast.error(message, { id: toastId });
    }
  };

  const handleScopeConfirm = (scope: RecurrenceScope) => {
    setIsScopeModalOpen(false);

    if (pendingScopeItem === null) return;

    if (scopeModalAction === 'delete') {
      executeDelete(pendingScopeItem.id, scope);
    } else {
      setPendingEditScope(scope);
      setEditingTransaction(pendingScopeItem);
      setIsModalOpen(true);
    }

    setPendingScopeItem(null);
  };

  const handleScopeCancel = () => {
    setIsScopeModalOpen(false);
    setPendingScopeItem(null);
  };

  const executeInstallmentDelete = async (transactionId: number, installmentNumber: number, scope: RecurrenceScope) => {
    const toastId = toast.loading('Excluindo parcelas...');
    try {
      await deleteInstallmentsByScope(transactionId, installmentNumber, scope);
      toast.success('Parcelas excluídas!', { id: toastId });
      fetchPageData();
    } catch (deleteError) {
      const message = extractErrorMessage(deleteError, 'Falha ao excluir as parcelas.');
      toast.error(message, { id: toastId });
    }
  };

  const handleInstallmentScopeConfirm = async (scope: RecurrenceScope) => {
    setIsInstallmentScopeModalOpen(false);

    if (pendingInstallmentItem === null || pendingInstallmentItem.currentInstallmentNumber === undefined) return;

    const installmentNumber = pendingInstallmentItem.currentInstallmentNumber;
    const transactionId = pendingInstallmentItem.id;

    setPendingInstallmentItem(null);

    if (installmentScopeModalAction === 'delete') {
      executeInstallmentDelete(transactionId, installmentNumber, scope);
      return;
    }

    try {
      const originalTransaction = await getTransactionById(transactionId);
      setPendingInstallmentEditScope(scope);
      setPendingInstallmentNumber(installmentNumber);
      setEditingTransaction(originalTransaction);
      setIsModalOpen(true);
    } catch {
      toast.error('Não foi possível carregar os dados da transação para edição.');
    }
  };

  const handleInstallmentScopeCancel = () => {
    setIsInstallmentScopeModalOpen(false);
    setPendingInstallmentItem(null);
  };

  const handleFixedBillScopeConfirm = async (scope: FixedBillScope, anchorMonth: string) => {
    setIsFixedBillScopeModalOpen(false);

    if (pendingFixedBillItem === null) return;

    const item = pendingFixedBillItem;
    setPendingFixedBillItem(null);

    if (fixedBillScopeModalAction === 'delete') {
      const toastId = toast.loading('Excluindo conta fixa...');
      try {
        await deleteFixedBillScoped(item.id, scope, anchorMonth);
        toast.success('Conta fixa excluída!', { id: toastId });
        fetchPageData();
      } catch (deleteError) {
        const message = extractErrorMessage(deleteError, 'Falha ao excluir a conta fixa.');
        toast.error(message, { id: toastId });
      }
      return;
    }

    const asBill: FixedBill = {
      transactionId: item.id,
      description: item.description,
      totalAmount: item.totalAmount,
      categoryName: item.categoryName ?? null,
      financialSourceName: item.financialSourceName ?? null,
      financialSourceType: item.financialSourceType,
      dayOfMonth: item.dayOfMonth ?? 1,
      isPaid: item.isPaid,
      paymentId: null,
    };

    setFixedBillEditTarget(asBill);
    setFixedBillEditScope(scope);
    setFixedBillEditAnchorMonth(anchorMonth);
    setIsFixedBillEditModalOpen(true);
  };

  const handleFixedBillScopeCancel = () => {
    setIsFixedBillScopeModalOpen(false);
    setPendingFixedBillItem(null);
  };

  const handleFixedBillEditSave = async (updateData: FixedBillUpdateData) => {
    if (fixedBillEditTarget === null) return;

    const toastId = toast.loading('Salvando alterações...');
    try {
      await updateFixedBillScoped(fixedBillEditTarget.transactionId, updateData);
      toast.success('Conta fixa atualizada!', { id: toastId });
      setIsFixedBillEditModalOpen(false);
      setFixedBillEditTarget(null);
      fetchPageData();
    } catch (saveError) {
      const message = extractErrorMessage(saveError, 'Falha ao atualizar a conta fixa.');
      toast.error(message, { id: toastId });
      throw saveError;
    }
  };

  const handleFixedBillEditCancel = () => {
    setIsFixedBillEditModalOpen(false);
    setFixedBillEditTarget(null);
  };

  const handleToggleInstallmentBreakdown = (rowId: string) => {
    setExpandedInstallmentRowId(prev => (prev === rowId ? null : rowId));
  };

  const handleSettleRequest = (transactionId: number) => {
    setSettleConfirmId(transactionId);
  };

  const handleSettleConfirm = async () => {
    if (settleConfirmId === null) return;
    const transactionId = settleConfirmId;
    setSettleConfirmId(null);

    setSettlingId(transactionId);
    const toastId = toast.loading('Quitando parcelas...');
    try {
      await settleInstallments(transactionId);
      toast.success('Parcelas quitadas com sucesso!', { id: toastId });
      fetchPageData();
    } catch (settleError) {
      const message = extractErrorMessage(settleError, 'Não foi possível quitar as parcelas.');
      toast.error(message, { id: toastId });
    } finally {
      setSettlingId(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmTransaction) return;
    const transaction = deleteConfirmTransaction;
    setDeleteConfirmTransaction(null);
    executeDelete(transaction.id, 'OnlyThis');
  };

  const hasUnpaidInstallments = (item: Transaction): boolean => {
    return item.isInstallment &&
      item.cardInstallments != null &&
      item.cardInstallments.some(i => !i.isPaid);
  };

  return (
    <>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Minhas Transações</h2>
            <p className="text-slate-400">Veja e gerencie todos os seus lançamentos.</p>
          </div>
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
          >
            <PlusCircle size={20} />
            Adicionar Transação
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h4 className="text-slate-400 text-sm">Total de Despesas do Mês</h4>
            <p className="text-2xl font-bold text-white mt-1">{formatBRL(summary.totalAmount)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h4 className="text-slate-400 text-sm">Pago</h4>
            <p className="text-2xl font-bold text-green-400 mt-1">{formatBRL(summary.paidAmount)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h4 className="text-slate-400 text-sm">Pendente</h4>
            <p className="text-2xl font-bold text-red-400 mt-1">{formatBRL(summary.pendingAmount)}</p>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-col lg:flex-row gap-4 items-center flex-wrap">
          <MonthNavigator
            currentDate={currentDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            formatOptions={{ month: 'long', timeZone: 'UTC' }}
          />

          <div className="relative flex-grow w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full bg-slate-700 border-slate-600 rounded-md p-2 pl-10 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full lg:w-auto bg-slate-700 border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas as Categorias</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full lg:w-auto bg-slate-700 border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas as Origens</option>
            {financialSources.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>

          <div className="flex gap-2 w-full lg:w-auto">
            <button onClick={() => setFilterType('all')} className={`flex-1 lg:flex-none ${filterType === 'all' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg`}>Tudo</button>
            <button onClick={() => setFilterType('income')} className={`flex-1 lg:flex-none ${filterType === 'income' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg`}>Receitas</button>
            <button onClick={() => setFilterType('expense')} className={`flex-1 lg:flex-none ${filterType === 'expense' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg`}>Despesas</button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-10"><LoaderCircle className="animate-spin text-green-500" size={40} /></div>
        ) : (
          <>
            <div className="space-y-4 md:hidden">
              {monthlyItems.length > 0 ? (
                monthlyItems.map((item) => {
                  const rowId = item.syntheticId ?? String(item.id);
                  const hasInstallments = item.cardInstallments && item.cardInstallments.length > 0;
                  const isExpanded = expandedInstallmentRowId === rowId;
                  return (
                    <div key={rowId} className={`p-4 rounded-lg border transition-colors ${item.isPaid ? 'bg-green-900/20 border-green-800/20 text-slate-500' : 'bg-slate-800 border-slate-700'}`}>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center justify-center">
                          <button
                            onClick={() => handleTogglePaid(item as any)}
                            title={isCardTransaction(item) ? 'Pague pelo menu Fatura' : item.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                          >
                            {item.isPaid ? <CheckCircle className="text-green-400" /> : <XCircle className={isCardTransaction(item) ? 'text-slate-600 cursor-default' : 'text-slate-500 hover:text-slate-300'} />}
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-semibold ${item.isPaid ? 'line-through text-slate-400' : 'text-white'}`}>{item.description}</p>
                            {item.isRecurring && (
                              <span title="Recorrente" className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded">
                                <RefreshCw size={10} />
                                Recorrente
                              </span>
                            )}
                            {hasInstallments && (
                              <button
                                onClick={() => handleToggleInstallmentBreakdown(rowId)}
                                title="Ver parcelas"
                                className="flex items-center gap-1 text-xs text-purple-300 bg-purple-900/40 hover:bg-purple-800/60 px-1.5 py-0.5 rounded transition-colors"
                              >
                                <CreditCard size={10} />
                                {item.cardInstallments!.length}x
                              </button>
                            )}
                          </div>
                          <div className={`text-sm flex items-center gap-1 flex-wrap ${item.isPaid ? 'line-through text-slate-500' : 'text-slate-400'}`}>
                            <CategoryBadge
                              name={item.categoryName}
                              color={categories.find(c => c.id === item.categoryId)?.color}
                              faded={item.isPaid}
                            />
                            <span>•</span>
                            <span>{item.financialSourceName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${item.isPaid ? 'opacity-50' : ''} ${item.transactionType.toLowerCase() === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                            {renderAmountCell(item as any)}
                          </p>
                          <div className="flex gap-2 justify-end mt-1 flex-wrap">
                            {hasUnpaidInstallments(item) && (
                              <button
                                onClick={() => handleSettleRequest(item.id)}
                                disabled={settlingId === item.id}
                                className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed border border-green-700 px-2 py-0.5 rounded transition-colors"
                                title="Quitar todas as parcelas"
                              >
                                {settlingId === item.id ? '...' : 'Quitar'}
                              </button>
                            )}
                            <button onClick={() => handleOpenModal(item)} className="text-slate-400 hover:text-white"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(item)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                      {isExpanded && hasInstallments && (
                        <InstallmentBreakdown installments={item.cardInstallments!} />
                      )}
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={<ArrowRightLeft size={40} />}
                  title="Nenhuma transação encontrada"
                  description="Nenhuma transação corresponde aos filtros atuais. Tente ajustar os filtros ou adicione uma nova transação."
                  action={{ label: 'Adicionar Transação', onClick: () => handleOpenModal(null) }}
                />
              )}
            </div>

            <div className="hidden md:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="p-4 font-semibold w-12 text-center">Status</th>
                    <th className="p-4 font-semibold">Descrição</th>
                    <th className="p-4 font-semibold">Valor</th>
                    <th className="p-4 font-semibold">Categoria</th>
                    <th className="p-4 font-semibold">Fonte</th>
                    <th className="p-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyItems.length > 0 ? (
                    monthlyItems.map((item) => {
                      const rowId = item.syntheticId ?? String(item.id);
                      const hasInstallments = item.cardInstallments && item.cardInstallments.length > 0;
                      const isExpanded = expandedInstallmentRowId === rowId;
                      return (
                        <React.Fragment key={rowId}>
                          <tr className={`border-b border-slate-700 transition-colors ${!isExpanded ? 'last:border-b-0' : ''} ${item.isPaid ? 'bg-green-900/20 hover:bg-green-800/30 text-slate-500' : 'hover:bg-slate-700/30'}`}>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleTogglePaid(item as any)}
                                title={isCardTransaction(item) ? 'Pague pelo menu Fatura' : item.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                              >
                                {item.isPaid ? <CheckCircle className="text-green-400" /> : <XCircle className={isCardTransaction(item) ? 'text-slate-600 cursor-default' : 'text-slate-500 hover:text-slate-300'} />}
                              </button>
                            </td>
                            <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-100'}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{item.description}</span>
                                {item.isRecurring && (
                                  <span title="Recorrente" className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded whitespace-nowrap">
                                    <RefreshCw size={10} />
                                    Recorrente
                                  </span>
                                )}
                                {hasInstallments && (
                                  <button
                                    onClick={() => handleToggleInstallmentBreakdown(rowId)}
                                    title="Ver parcelas"
                                    className="flex items-center gap-1 text-xs text-purple-300 bg-purple-900/40 hover:bg-purple-800/60 px-1.5 py-0.5 rounded whitespace-nowrap transition-colors"
                                  >
                                    <CreditCard size={10} />
                                    {item.cardInstallments!.length}x
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className={`p-4 font-bold ${item.isPaid ? 'opacity-50' : ''} ${item.transactionType.toLowerCase() === 'income' ? 'text-green-400' : 'text-red-400'}`}>{renderAmountCell(item as any)}</td>
                            <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-400'}`}>
                              <CategoryBadge
                                name={item.categoryName}
                                color={categories.find(c => c.id === item.categoryId)?.color}
                                faded={item.isPaid}
                              />
                            </td>
                            <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-400'}`}>{item.financialSourceName}</td>
                            <td className="p-4 text-right">
                              {hasUnpaidInstallments(item) && (
                                <button
                                  onClick={() => handleSettleRequest(item.id)}
                                  disabled={settlingId === item.id}
                                  className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed border border-green-700 px-2 py-1 rounded mr-1 transition-colors"
                                  title="Quitar todas as parcelas"
                                >
                                  {settlingId === item.id ? '...' : 'Quitar'}
                                </button>
                              )}
                              <button onClick={() => handleOpenModal(item)} className="text-slate-400 hover:text-white p-2" title="Editar Transação Original"><Edit size={18} /></button>
                              <button onClick={() => handleDelete(item)} className="text-slate-400 hover:text-red-400 p-2" title="Excluir Transação Original"><Trash2 size={18} /></button>
                            </td>
                          </tr>
                          {isExpanded && hasInstallments && (
                            <tr className="border-b border-slate-700">
                              <td colSpan={6} className="px-4 pb-4">
                                <InstallmentBreakdown installments={item.cardInstallments!} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<ArrowRightLeft size={40} />}
                          title="Nenhuma transação encontrada"
                          description="Nenhuma transação corresponde aos filtros atuais. Tente ajustar os filtros ou adicione uma nova transação."
                          action={{ label: 'Adicionar Transação', onClick: () => handleOpenModal(null) }}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        transactionToEdit={editingTransaction}
        recurrenceScope={pendingEditScope}
        installmentScope={pendingInstallmentEditScope}
        installmentNumber={pendingInstallmentNumber}
      />
      <RecurrenceScopeModal
        isOpen={isScopeModalOpen}
        action={scopeModalAction}
        onConfirm={handleScopeConfirm}
        onCancel={handleScopeCancel}
      />
      <RecurrenceScopeModal
        isOpen={isInstallmentScopeModalOpen}
        action={installmentScopeModalAction}
        variant="installment"
        onConfirm={handleInstallmentScopeConfirm}
        onCancel={handleInstallmentScopeCancel}
      />

      {pendingFixedBillItem !== null && (
        <FixedBillScopeModal
          isOpen={isFixedBillScopeModalOpen}
          action={fixedBillScopeModalAction}
          currentMonth={buildMonthParam(currentDate)}
          onConfirm={handleFixedBillScopeConfirm}
          onCancel={handleFixedBillScopeCancel}
        />
      )}

      {fixedBillEditTarget !== null && (
        <FixedBillEditModal
          isOpen={isFixedBillEditModalOpen}
          bill={fixedBillEditTarget}
          scope={fixedBillEditScope}
          anchorMonth={fixedBillEditAnchorMonth}
          onSave={handleFixedBillEditSave}
          onCancel={handleFixedBillEditCancel}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirmTransaction !== null}
        title="Excluir Transação"
        message={`Tem certeza que deseja excluir "${deleteConfirmTransaction?.description}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmTransaction(null)}
      />

      <ConfirmModal
        isOpen={settleConfirmId !== null}
        title="Quitar Parcelas"
        message="Quitar essa dívida marcará todas as parcelas restantes como pagas. Deseja continuar?"
        confirmLabel="Quitar"
        confirmVariant="warning"
        onConfirm={handleSettleConfirm}
        onCancel={() => setSettleConfirmId(null)}
      />
    </>
  );
}
