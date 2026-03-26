import { useState, useMemo, useCallback } from 'react';
import { CheckCircle, XCircle, Receipt, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFixedBills } from '../hooks/useFixedBills';
import { FixedBill, FixedBillScope, FixedBillUpdateData } from '../types';
import { formatBRL } from '../utils/formatters';
import { MonthNavigator } from '../components/ui/MonthNavigator';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { FixedBillScopeModal } from '../components/features/transactions/FixedBillScopeModal';
import { FixedBillEditModal } from '../components/features/transactions/FixedBillEditModal';
import { deleteFixedBillScoped, updateFixedBillScoped } from '../services/api';
import { extractErrorMessage } from '../utils/errors';

const MONTH_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric', timeZone: 'UTC' };

function formatMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function SummaryCards({ totalAmount, paidAmount, pendingAmount }: {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-slate-400 text-sm">Total Fixo</h4>
        <p className="text-2xl font-bold text-white mt-1">{formatBRL(totalAmount)}</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-slate-400 text-sm">Pago</h4>
        <p className="text-2xl font-bold text-green-400 mt-1">{formatBRL(paidAmount)}</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-slate-400 text-sm">Pendente</h4>
        <p className="text-2xl font-bold text-red-400 mt-1">{formatBRL(pendingAmount)}</p>
      </div>
    </div>
  );
}

function FixedBillCard({
  bill,
  onTogglePaid,
  onEdit,
  onDelete,
}: {
  bill: FixedBill;
  onTogglePaid: (transactionId: number, currentlyPaid: boolean) => void;
  onEdit: (bill: FixedBill) => void;
  onDelete: (bill: FixedBill) => void;
}) {
  const isCard = bill.financialSourceType === 'Card';
  return (
    <div className={`p-4 rounded-lg border transition-colors ${bill.isPaid ? 'bg-green-900/20 border-green-800/20' : 'bg-slate-800 border-slate-700'}`}>
      <div className="flex gap-3 items-start">
        <button
          onClick={() => onTogglePaid(bill.transactionId, bill.isPaid)}
          className="mt-0.5 flex-shrink-0 rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-green-500"
          title={isCard ? 'Pague pelo menu Fatura' : bill.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
        >
          {bill.isPaid
            ? <CheckCircle className="text-green-400" size={20} />
            : <XCircle className={isCard ? 'text-slate-600' : 'text-slate-500'} size={20} />}
        </button>
        <div className="flex-1">
          <p className={`font-semibold ${bill.isPaid ? 'line-through text-slate-400' : 'text-white'}`}>
            {bill.description}
          </p>
          <p className={`text-sm mt-0.5 ${bill.isPaid ? 'text-slate-500' : 'text-slate-400'}`}>
            {bill.categoryName ?? '-'} &bull; {bill.financialSourceName ?? '-'}
          </p>
          <p className={`text-xs mt-1 ${bill.isPaid ? 'text-slate-500' : 'text-slate-500'}`}>
            Vence dia {bill.dayOfMonth}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className={`font-bold text-red-400 ${bill.isPaid ? 'opacity-50' : ''}`}>
            {formatBRL(bill.totalAmount)}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(bill)}
              className="text-slate-400 hover:text-blue-400 transition-colors p-1"
              title="Editar"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(bill)}
              className="text-slate-400 hover:text-red-400 transition-colors p-1"
              title="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FixedBillRow({
  bill,
  onTogglePaid,
  onEdit,
  onDelete,
}: {
  bill: FixedBill;
  onTogglePaid: (transactionId: number, currentlyPaid: boolean) => void;
  onEdit: (bill: FixedBill) => void;
  onDelete: (bill: FixedBill) => void;
}) {
  const isCard = bill.financialSourceType === 'Card';
  return (
    <tr className={`border-b border-slate-700 last:border-b-0 transition-colors ${bill.isPaid ? 'bg-green-900/20 text-slate-500' : 'hover:bg-slate-700/30'}`}>
      <td className="p-4 text-center">
        <button
          onClick={() => onTogglePaid(bill.transactionId, bill.isPaid)}
          className="inline-flex items-center justify-center rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-green-500"
          title={isCard ? 'Pague pelo menu Fatura' : bill.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
        >
          {bill.isPaid
            ? <CheckCircle className="text-green-400" size={20} />
            : <XCircle className={isCard ? 'text-slate-600' : 'text-slate-500'} size={20} />}
        </button>
      </td>
      <td className={`p-4 ${bill.isPaid ? 'line-through' : 'text-slate-100'}`}>
        {bill.description}
      </td>
      <td className={`p-4 text-sm ${bill.isPaid ? 'line-through' : 'text-slate-400'}`}>
        {bill.categoryName ?? '-'}
      </td>
      <td className={`p-4 text-sm ${bill.isPaid ? 'line-through' : 'text-slate-400'}`}>
        {bill.financialSourceName ?? '-'}
      </td>
      <td className={`p-4 text-sm ${bill.isPaid ? 'text-slate-500' : 'text-slate-400'}`}>
        Dia {bill.dayOfMonth}
      </td>
      <td className={`p-4 font-bold text-right text-red-400 ${bill.isPaid ? 'opacity-50' : ''}`}>
        {formatBRL(bill.totalAmount)}
      </td>
      <td className="p-4 text-center">
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => onEdit(bill)}
            className="text-slate-400 hover:text-blue-400 transition-colors p-1"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(bill)}
            className="text-slate-400 hover:text-red-400 transition-colors p-1"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function FixedBillsPage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });

  const monthKey = useMemo(() => formatMonthKey(currentDate), [currentDate]);

  const { data, isLoading, error, togglePaid, refetch } = useFixedBills(monthKey);

  const [pendingBill, setPendingBill] = useState<FixedBill | null>(null);
  const [scopeModalAction, setScopeModalAction] = useState<'edit' | 'delete'>('delete');
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  const [editBill, setEditBill] = useState<FixedBill | null>(null);
  const [editScope, setEditScope] = useState<FixedBillScope>('All');
  const [editAnchorMonth, setEditAnchorMonth] = useState<string>(monthKey);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleTogglePaid = useCallback((transactionId: number, currentlyPaid: boolean) => {
    const bill = data?.items.find(b => b.transactionId === transactionId);
    if (bill?.financialSourceType === 'Card') {
      toast('Contas de cartao sao pagas na tela Fatura.');
      return;
    }
    togglePaid(transactionId, currentlyPaid);
  }, [data, togglePaid]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)));
  };

  const handleOpenEdit = useCallback((bill: FixedBill) => {
    setPendingBill(bill);
    setScopeModalAction('edit');
    setIsScopeModalOpen(true);
  }, []);

  const handleOpenDelete = useCallback((bill: FixedBill) => {
    setPendingBill(bill);
    setScopeModalAction('delete');
    setIsScopeModalOpen(true);
  }, []);

  const handleScopeConfirm = useCallback((scope: FixedBillScope, anchorMonth: string) => {
    setIsScopeModalOpen(false);

    if (pendingBill === null) return;

    if (scopeModalAction === 'delete') {
      executeDelete(pendingBill.transactionId, scope, anchorMonth);
      setPendingBill(null);
      return;
    }

    setEditBill(pendingBill);
    setEditScope(scope);
    setEditAnchorMonth(anchorMonth);
    setIsEditModalOpen(true);
    setPendingBill(null);
  }, [pendingBill, scopeModalAction]);

  const handleScopeCancel = () => {
    setIsScopeModalOpen(false);
    setPendingBill(null);
  };

  const executeDelete = async (transactionId: number, scope: FixedBillScope, anchorMonth: string) => {
    const toastId = toast.loading('Excluindo conta fixa...');
    try {
      await deleteFixedBillScoped(transactionId, scope, anchorMonth);
      toast.success('Conta fixa excluida!', { id: toastId });
      refetch();
    } catch (deleteError) {
      const message = extractErrorMessage(deleteError, 'Falha ao excluir a conta fixa.');
      toast.error(message, { id: toastId });
    }
  };

  const handleEditSave = async (updateData: FixedBillUpdateData) => {
    if (editBill === null) return;

    const toastId = toast.loading('Salvando alteracoes...');
    try {
      await updateFixedBillScoped(editBill.transactionId, updateData);
      toast.success('Conta fixa atualizada!', { id: toastId });
      setIsEditModalOpen(false);
      setEditBill(null);
      refetch();
    } catch (saveError) {
      const message = extractErrorMessage(saveError, 'Falha ao atualizar a conta fixa.');
      toast.error(message, { id: toastId });
      throw saveError;
    }
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditBill(null);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Contas Fixas</h2>
        <p className="text-slate-400">Acompanhe e marque o pagamento das suas despesas mensais fixas.</p>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-wrap items-center gap-3">
        <MonthNavigator
          currentDate={currentDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          formatOptions={MONTH_FORMAT_OPTIONS}
        />
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {data && (
        <SummaryCards
          totalAmount={data.totalAmount}
          paidAmount={data.paidAmount}
          pendingAmount={data.pendingAmount}
        />
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={<Receipt size={40} />}
          title="Nenhuma conta fixa cadastrada"
          description="Crie uma transacao com a opcao Fixa ativada para ela aparecer aqui."
        />
      )}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <div className="space-y-4 md:hidden">
            {data.items.map(bill => (
              <FixedBillCard
                key={bill.transactionId}
                bill={bill}
                onTogglePaid={handleTogglePaid}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}
          </div>

          <div className="hidden md:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="p-4 font-semibold w-12 text-center">Status</th>
                  <th className="p-4 font-semibold">Descricao</th>
                  <th className="p-4 font-semibold">Categoria</th>
                  <th className="p-4 font-semibold">Fonte</th>
                  <th className="p-4 font-semibold">Vencimento</th>
                  <th className="p-4 font-semibold text-right">Valor</th>
                  <th className="p-4 font-semibold w-20 text-center">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(bill => (
                  <FixedBillRow
                    key={bill.transactionId}
                    bill={bill}
                    onTogglePaid={handleTogglePaid}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pendingBill !== null && (
        <FixedBillScopeModal
          isOpen={isScopeModalOpen}
          action={scopeModalAction}
          currentMonth={monthKey}
          onConfirm={handleScopeConfirm}
          onCancel={handleScopeCancel}
        />
      )}

      {editBill !== null && (
        <FixedBillEditModal
          isOpen={isEditModalOpen}
          bill={editBill}
          scope={editScope}
          anchorMonth={editAnchorMonth}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}
