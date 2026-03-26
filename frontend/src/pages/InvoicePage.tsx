import { useState, useEffect, useMemo } from 'react';
import { LoaderCircle, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFinancialSources, payInvoice, toggleInstallmentPaidStatus } from '../services/api';
import { useInvoice } from '../hooks/useInvoice';
import { FinancialSource, InvoiceItem } from '../types';
import { formatBRL } from '../utils/formatters';
import { extractErrorMessage } from '../utils/errors';
import { MonthNavigator } from '../components/ui/MonthNavigator';

const MONTH_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric', timeZone: 'UTC' };

function formatMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function InvoiceSummaryCards({ totalAmount, paidAmount, pendingAmount, closingDate, dueDate }: {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  closingDate: string;
  dueDate: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-slate-400 text-sm">Total da Fatura</h4>
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
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-1">
        <p className="text-slate-400 text-sm">Fechamento: <span className="text-slate-200 font-medium">{formatDisplayDate(closingDate)}</span></p>
        <p className="text-slate-400 text-sm">Vencimento: <span className="text-slate-200 font-medium">{formatDisplayDate(dueDate)}</span></p>
      </div>
    </div>
  );
}

function InstallmentBadge({ number, count }: { number: number; count: number }) {
  if (count <= 1) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded whitespace-nowrap">
      <CreditCard size={10} />
      {number}/{count}
    </span>
  );
}

function InvoiceItemRow({ item, onTogglePaid }: { item: InvoiceItem; onTogglePaid: (id: number) => void }) {
  return (
    <tr className={`border-b border-slate-700 last:border-b-0 transition-colors ${item.isPaid ? 'bg-green-900/20 text-slate-500' : 'hover:bg-slate-700/30'}`}>
      <td className="p-4 text-center">
        <button
          onClick={() => onTogglePaid(item.installmentId)}
          className="inline-flex items-center justify-center rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-green-500"
          title={item.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
        >
          {item.isPaid
            ? <CheckCircle className="text-green-400" size={20} />
            : <XCircle className="text-slate-500" size={20} />}
        </button>
      </td>
      <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-100'}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span>{item.description}</span>
          <InstallmentBadge number={item.installmentNumber} count={item.installmentCount} />
        </div>
      </td>
      <td className={`p-4 text-sm ${item.isPaid ? 'line-through' : 'text-slate-400'}`}>
        {formatDisplayDate(item.purchaseDate)}
      </td>
      <td className={`p-4 text-sm ${item.isPaid ? 'line-through' : 'text-slate-400'}`}>
        {item.categoryName ?? '-'}
      </td>
      <td className={`p-4 font-bold text-right text-red-400 ${item.isPaid ? 'opacity-50' : ''}`}>
        {formatBRL(item.amount)}
      </td>
    </tr>
  );
}

function InvoiceItemCard({ item, onTogglePaid }: { item: InvoiceItem; onTogglePaid: (id: number) => void }) {
  return (
    <div className={`p-4 rounded-lg border transition-colors ${item.isPaid ? 'bg-green-900/20 border-green-800/20' : 'bg-slate-800 border-slate-700'}`}>
      <div className="flex gap-3 items-start">
        <button
          onClick={() => onTogglePaid(item.installmentId)}
          className="mt-0.5 flex-shrink-0 rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-green-500"
          title={item.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
        >
          {item.isPaid
            ? <CheckCircle className="text-green-400" size={20} />
            : <XCircle className="text-slate-500" size={20} />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold ${item.isPaid ? 'line-through text-slate-400' : 'text-white'}`}>
              {item.description}
            </p>
            <InstallmentBadge number={item.installmentNumber} count={item.installmentCount} />
          </div>
          <p className={`text-sm mt-0.5 ${item.isPaid ? 'text-slate-500' : 'text-slate-400'}`}>
            {item.categoryName ?? '-'} &bull; {formatDisplayDate(item.purchaseDate)}
          </p>
        </div>
        <p className={`font-bold text-red-400 ${item.isPaid ? 'opacity-50' : ''}`}>
          {formatBRL(item.amount)}
        </p>
      </div>
    </div>
  );
}

export function InvoicePage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });
  const [cardSources, setCardSources] = useState<FinancialSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isPayingInvoice, setIsPayingInvoice] = useState(false);

  const monthKey = useMemo(() => formatMonthKey(currentDate), [currentDate]);

  const { invoice, isLoading: isLoadingInvoice, error, refetch } = useInvoice(selectedSourceId, monthKey);

  useEffect(() => {
    const loadCardSources = async () => {
      try {
        const sources = await getFinancialSources();
        const cards = sources.filter(s => s.type === 'Card');
        setCardSources(cards);
        if (cards.length > 0) {
          setSelectedSourceId(cards[0].id);
        }
      } catch (sourceError) {
        const message = extractErrorMessage(sourceError, 'Não foi possível carregar os cartões de crédito.');
        toast.error(message);
      } finally {
        setIsLoadingSources(false);
      }
    };

    loadCardSources();
  }, []);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)));
  };

  const handleSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedSourceId(value === '' ? null : Number(value));
  };

  const handlePayInvoice = async () => {
    if (selectedSourceId === null) return;

    const toastId = toast.loading('Pagando fatura...');
    setIsPayingInvoice(true);

    try {
      await payInvoice(selectedSourceId, monthKey);
      toast.success('Fatura paga com sucesso.', { id: toastId });
      refetch();
    } catch (payError) {
      const message = extractErrorMessage(payError, 'Não foi possível pagar a fatura. Tente novamente.');
      toast.error(message, { id: toastId });
    } finally {
      setIsPayingInvoice(false);
    }
  };

  const handleToggleItemPaid = async (installmentId: number) => {
    const toastId = toast.loading('Atualizando status...');
    try {
      await toggleInstallmentPaidStatus(installmentId);
      toast.success('Status atualizado.', { id: toastId });
      refetch();
    } catch (toggleError) {
      const message = extractErrorMessage(toggleError, 'Não foi possível atualizar o status do item.');
      toast.error(message, { id: toastId });
    }
  };

  const invoiceSummary = useMemo(() => {
    if (!invoice) return null;
    const paidAmount = invoice.items.filter(i => i.isPaid).reduce((acc, i) => acc + i.amount, 0);
    const pendingAmount = invoice.items.filter(i => !i.isPaid).reduce((acc, i) => acc + i.amount, 0);
    return { paidAmount, pendingAmount };
  }, [invoice]);

  const hasUnpaidItems = invoice?.items.some(i => !i.isPaid) ?? false;
  const isFullyPaid = invoice !== null && invoice.items.length > 0 && !hasUnpaidItems;

  const isLoading = isLoadingSources || isLoadingInvoice;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Fatura do Cartão</h2>
          <p className="text-slate-400">Veja os lançamentos da fatura do seu cartão de crédito.</p>
        </div>
        {isFullyPaid && (
          <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-900/40 border border-green-700 text-green-300 font-semibold text-sm">
            <CheckCircle size={16} />
            Fatura paga
          </span>
        )}
        {hasUnpaidItems && (
          <button
            onClick={handlePayInvoice}
            disabled={isPayingInvoice}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {isPayingInvoice
              ? <LoaderCircle size={16} className="animate-spin" />
              : <CheckCircle size={16} />}
            Pagar fatura
          </button>
        )}
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-col sm:flex-row gap-4 items-center flex-wrap">
        <MonthNavigator
          currentDate={currentDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          formatOptions={MONTH_FORMAT_OPTIONS}
        />

        {isLoadingSources ? (
          <div className="flex items-center gap-2 text-slate-400">
            <LoaderCircle className="animate-spin" size={16} />
            <span>Carregando cartoes...</span>
          </div>
        ) : (
          <select
            value={selectedSourceId ?? ''}
            onChange={handleSourceChange}
            className="w-full sm:w-auto bg-slate-700 border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Selecione um cartão</option>
            {cardSources.map(source => (
              <option key={source.id} value={source.id}>{source.name}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {invoice && invoiceSummary && (
        <InvoiceSummaryCards
          totalAmount={invoice.totalAmount}
          paidAmount={invoiceSummary.paidAmount}
          pendingAmount={invoiceSummary.pendingAmount}
          closingDate={invoice.closingDate}
          dueDate={invoice.dueDate}
        />
      )}

      {isLoading && (
        <div className="flex justify-center items-center p-10">
          <LoaderCircle className="animate-spin text-green-500" size={40} />
        </div>
      )}

      {!isLoading && selectedSourceId === null && (
        <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">
          Selecione um cartão de crédito para ver a fatura.
        </div>
      )}

      {!isLoading && selectedSourceId !== null && invoice && invoice.items.length === 0 && (
        <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">
          Nenhum lançamento encontrado nesta fatura.
        </div>
      )}

      {!isLoading && invoice && invoice.items.length > 0 && (
        <>
          <div className="space-y-4 md:hidden">
            {invoice.items.map(item => (
              <InvoiceItemCard key={item.installmentId} item={item} onTogglePaid={handleToggleItemPaid} />
            ))}
          </div>

          <div className="hidden md:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="p-4 font-semibold w-12 text-center">Status</th>
                  <th className="p-4 font-semibold">Descrição</th>
                  <th className="p-4 font-semibold">Data da Compra</th>
                  <th className="p-4 font-semibold">Categoria</th>
                  <th className="p-4 font-semibold text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map(item => (
                  <InvoiceItemRow key={item.installmentId} item={item} onTogglePaid={handleToggleItemPaid} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
