import { useState } from 'react';
import { LoaderCircle, CheckCircle, Calculator, TrendingDown } from 'lucide-react';
import { settleInstallments } from '../services/api';
import { useSimulation } from '../hooks/useSimulation';
import { SimulationItem } from '../types';
import toast from 'react-hot-toast';

function formatCurrency(amount: number): string {
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: 'red' | 'blue' }) {
  const valueColor = highlight === 'red'
    ? 'text-red-400'
    : highlight === 'blue'
    ? 'text-blue-400'
    : 'text-white';

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h4 className="text-slate-400 text-sm">{label}</h4>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
    </div>
  );
}

function InstallmentProgressBar({ paid, total }: { paid: number; total: number }) {
  const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{paid}/{total} parcelas pagas</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SimulationItemCard({
  item,
  onSettle,
  isSettling,
}: {
  item: SimulationItem;
  onSettle: (id: number) => void;
  isSettling: boolean;
}) {
  return (
    <div className="bg-slate-800 p-4 sm:p-5 rounded-lg border border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-white text-base">{item.description}</p>
            <span className="text-xs text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded">
              {item.financialSourceName}
            </span>
          </div>

          <div className="text-sm text-slate-400 mb-3">
            Proximo vencimento: <span className="text-slate-200">{formatDate(item.nextDueDate)}</span>
          </div>

          <InstallmentProgressBar paid={item.paidInstallments} total={item.installmentCount} />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs text-slate-400">Parcela mensal</p>
              <p className="font-semibold text-slate-100">{formatCurrency(item.monthlyAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total a quitar</p>
              <p className="font-semibold text-red-400">{formatCurrency(item.remainingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={() => onSettle(item.transactionId)}
            disabled={isSettling}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors whitespace-nowrap"
          >
            {isSettling
              ? <LoaderCircle size={16} className="animate-spin" />
              : <CheckCircle size={16} />}
            Quitar agora
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center p-10 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">
      <TrendingDown className="mx-auto mb-3 text-green-500" size={40} />
      <p className="font-semibold text-white mb-1">Nenhum parcelado ativo</p>
      <p className="text-sm">Voce nao possui compras parceladas com parcelas em aberto.</p>
    </div>
  );
}

export function SimulationPage() {
  const { simulation, isLoading, error, refetch } = useSimulation();
  const [settlingId, setSettlingId] = useState<number | null>(null);

  const handleSettle = async (transactionId: number) => {
    setSettlingId(transactionId);
    const toastId = toast.loading('Quitando parcelas...');

    try {
      await settleInstallments(transactionId);
      toast.success('Parcelas quitadas com sucesso!', { id: toastId });
      refetch();
    } catch {
      toast.error('Nao foi possivel quitar as parcelas.', { id: toastId });
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="text-green-500" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-white">Simulacao de Quitacao</h2>
            <p className="text-slate-400">Veja e quite suas compras parceladas em aberto.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center p-10">
          <LoaderCircle className="animate-spin text-green-500" size={40} />
        </div>
      )}

      {!isLoading && simulation && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <SummaryCard
              label="Total a quitar"
              value={formatCurrency(simulation.totalRemainingAmount)}
              highlight="red"
            />
            <SummaryCard
              label="Compromisso mensal"
              value={formatCurrency(simulation.totalMonthlyCommitment)}
              highlight="blue"
            />
          </div>

          {simulation.items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {simulation.items.map((item) => (
                <SimulationItemCard
                  key={item.transactionId}
                  item={item}
                  onSettle={handleSettle}
                  isSettling={settlingId === item.transactionId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
