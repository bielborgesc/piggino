import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, CheckCircle, XCircle } from 'lucide-react';
import { useFixedBills } from '../hooks/useFixedBills';
import { FixedBill } from '../types';

const MONTH_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric', timeZone: 'UTC' };

function formatMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function MonthNavigator({ currentDate, onPreviousMonth, onNextMonth }: {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}) {
  const label = currentDate.toLocaleString('pt-BR', MONTH_FORMAT_OPTIONS);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 bg-slate-700/50 p-2 rounded-lg">
      <button onClick={onPreviousMonth} className="p-2 rounded-md hover:bg-slate-600 transition-colors">
        <ChevronLeft size={20} />
      </button>
      <span className="text-base sm:text-lg font-semibold w-44 text-center capitalize">{label}</span>
      <button onClick={onNextMonth} className="p-2 rounded-md hover:bg-slate-600 transition-colors">
        <ChevronRight size={20} />
      </button>
    </div>
  );
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
        <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalAmount)}</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-slate-400 text-sm">Pago</h4>
        <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(paidAmount)}</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-slate-400 text-sm">Pendente</h4>
        <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(pendingAmount)}</p>
      </div>
    </div>
  );
}

function FixedBillCard({ bill, onTogglePaid }: {
  bill: FixedBill;
  onTogglePaid: (transactionId: number, currentlyPaid: boolean) => void;
}) {
  return (
    <div className={`p-4 rounded-lg border transition-colors ${bill.isPaid ? 'bg-green-900/20 border-green-800/20' : 'bg-slate-800 border-slate-700'}`}>
      <div className="flex gap-3 items-start">
        <button
          onClick={() => onTogglePaid(bill.transactionId, bill.isPaid)}
          className="mt-0.5 flex-shrink-0 rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-green-500"
          title={bill.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
        >
          {bill.isPaid
            ? <CheckCircle className="text-green-400" size={20} />
            : <XCircle className="text-slate-500" size={20} />}
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
        <p className={`font-bold text-red-400 ${bill.isPaid ? 'opacity-50' : ''}`}>
          {formatCurrency(bill.totalAmount)}
        </p>
      </div>
    </div>
  );
}

function FixedBillRow({ bill, onTogglePaid }: {
  bill: FixedBill;
  onTogglePaid: (transactionId: number, currentlyPaid: boolean) => void;
}) {
  return (
    <tr className={`border-b border-slate-700 last:border-b-0 transition-colors ${bill.isPaid ? 'bg-green-900/20 text-slate-500' : 'hover:bg-slate-700/30'}`}>
      <td className="p-4 text-center">
        <button
          onClick={() => onTogglePaid(bill.transactionId, bill.isPaid)}
          className="inline-flex items-center justify-center rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-green-500"
          title={bill.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
        >
          {bill.isPaid
            ? <CheckCircle className="text-green-400" size={20} />
            : <XCircle className="text-slate-500" size={20} />}
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
        {formatCurrency(bill.totalAmount)}
      </td>
    </tr>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex justify-center items-center p-10">
      <LoaderCircle className="animate-spin text-green-500" size={40} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">
      Nenhuma conta fixa cadastrada. Crie uma transacao com "Fixa" ativado.
    </div>
  );
}

export function FixedBillsPage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });

  const monthKey = useMemo(() => formatMonthKey(currentDate), [currentDate]);

  const { data, isLoading, error, togglePaid } = useFixedBills(monthKey);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Contas Fixas</h2>
        <p className="text-slate-400">Acompanhe e marque o pagamento das suas despesas mensais fixas.</p>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex items-center">
        <MonthNavigator
          currentDate={currentDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
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

      {isLoading && <LoadingSkeleton />}

      {!isLoading && data && data.items.length === 0 && <EmptyState />}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <div className="space-y-4 md:hidden">
            {data.items.map(bill => (
              <FixedBillCard key={bill.transactionId} bill={bill} onTogglePaid={togglePaid} />
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
                </tr>
              </thead>
              <tbody>
                {data.items.map(bill => (
                  <FixedBillRow key={bill.transactionId} bill={bill} onTogglePaid={togglePaid} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
