import { useState } from 'react';
import { CreditCard, LoaderCircle, CheckCircle, PartyPopper, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebtSummary, DebtStrategy } from '../hooks/useDebtSummary';
import { useDebtSimulation } from '../hooks/useDebtSimulation';
import { settleInstallments } from '../services/api';
import { DebtItem } from '../types';
import { formatBRL } from '../utils/formatters';

const STRATEGY_LABELS: Record<DebtStrategy, string> = {
  Avalanche: 'Avalanche',
  Snowball: 'Bola de Neve',
};

function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function InstallmentProgressBar({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  const paid = total - remaining;
  const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>
          {paid}/{total} parcelas pagas
        </span>
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

function StrategyExplanationCard({ strategy }: { strategy: DebtStrategy }) {
  if (strategy === 'Avalanche') {
    return (
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-1">Estratégia Avalanche</h4>
        <p className="text-slate-300 text-sm">
          Prioriza quitar as dívidas com o <strong>maior pagamento mensal</strong> primeiro.
          Matematicamente ótima — você paga menos juros no longo prazo. Indicada para quem tem
          disciplina e foco em economizar dinheiro total.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
      <h4 className="text-purple-300 font-semibold mb-1">Estratégia Bola de Neve</h4>
      <p className="text-slate-300 text-sm">
        Prioriza quitar as dívidas com o <strong>menor saldo restante</strong> primeiro. Gera
        vitórias rápidas e aumenta a motivação. Indicada para quem precisa de impulso psicológico
        para manter o foco.
      </p>
    </div>
  );
}

function DebtSimulationPanel({
  debts,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  freedMonthlyAmount,
  totalSavings,
}: {
  debts: DebtItem[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  freedMonthlyAmount: number;
  totalSavings: number;
}) {
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-yellow-400" />
        <h3 className="text-white font-semibold">Simulação: Quitar Agora</h3>
      </div>
      <p className="text-slate-400 text-sm mb-4">
        Selecione as dívidas que você quer simular quitar hoje e veja o impacto no seu orçamento mensal.
      </p>

      <div className="flex gap-3 mb-4">
        <button
          onClick={onSelectAll}
          className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          Selecionar todas
        </button>
        <button
          onClick={onClearAll}
          className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          Limpar seleção
        </button>
      </div>

      <div className="space-y-2 mb-5">
        {debts.map((debt) => (
          <label
            key={debt.transactionId}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="checkbox"
                checked={selectedIds.has(debt.transactionId)}
                onChange={() => onToggle(debt.transactionId)}
                className="w-4 h-4 accent-green-500 flex-shrink-0"
              />
              <span className="text-sm text-slate-200 truncate">{debt.description}</span>
            </div>
            <span className="text-sm font-semibold text-slate-300 flex-shrink-0">
              {formatBRL(debt.monthlyPayment)}/mês
            </span>
          </label>
        ))}
      </div>

      <div
        className={`rounded-lg p-4 border transition-colors ${
          hasSelection
            ? 'bg-green-900/30 border-green-700/50'
            : 'bg-slate-700/30 border-slate-600/50'
        }`}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Pagamento mensal liberado</p>
            <p className={`text-xl font-bold ${hasSelection ? 'text-green-400' : 'text-slate-500'}`}>
              {formatBRL(freedMonthlyAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Economia total ao quitar</p>
            <p className={`text-xl font-bold ${hasSelection ? 'text-yellow-400' : 'text-slate-500'}`}>
              {formatBRL(totalSavings)}
            </p>
          </div>
        </div>
        {hasSelection && (
          <p className="text-green-300 text-xs mt-3">
            Selecionando {selectedIds.size} {selectedIds.size === 1 ? 'dívida' : 'dívidas'}, você
            liberaria <strong>{formatBRL(freedMonthlyAmount)}/mês</strong> no seu orçamento.
          </p>
        )}
      </div>
    </div>
  );
}

function DebtItemCard({
  debt,
  rank,
  onSettle,
  isSettling,
}: {
  debt: DebtItem;
  rank: number;
  onSettle: (id: number) => void;
  isSettling: boolean;
}) {
  return (
    <div className="bg-slate-800 p-4 sm:p-5 rounded-lg border border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
            #{rank}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-white text-base">{debt.description}</p>
            <span className="text-xs text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded">
              {debt.financialSourceName}
            </span>
          </div>

          <div className="text-sm text-slate-400 mb-3">
            Próximo vencimento:{' '}
            <span className="text-slate-200">{formatDate(debt.nextDueDate)}</span>
          </div>

          <InstallmentProgressBar
            remaining={debt.remainingInstallments}
            total={debt.totalInstallments}
          />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs text-slate-400">Parcela mensal</p>
              <p className="font-semibold text-slate-100">{formatBRL(debt.monthlyPayment)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Saldo restante</p>
              <p className="font-semibold text-red-400">{formatBRL(debt.totalRemaining)}</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 pt-1">
          <button
            onClick={() => onSettle(debt.transactionId)}
            disabled={isSettling}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors whitespace-nowrap"
          >
            {isSettling ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Quitar
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyDebtsState() {
  return (
    <div className="text-center p-10 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">
      <PartyPopper className="mx-auto mb-3 text-green-500" size={40} />
      <p className="font-semibold text-white mb-1">Nenhuma dívida ativa!</p>
      <p className="text-sm">Você não possui compras parceladas em aberto. Parabéns!</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'red' | 'blue';
}) {
  const valueColor =
    accent === 'red' ? 'text-red-400' : accent === 'blue' ? 'text-blue-400' : 'text-white';

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h4 className="text-slate-400 text-sm">{label}</h4>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
    </div>
  );
}

export function DebtPlanningPage() {
  const [strategy, setStrategy] = useState<DebtStrategy>('Snowball');
  const [settlingId, setSettlingId] = useState<number | null>(null);

  const { debtSummary, isLoading, error, refetch } = useDebtSummary(strategy);

  const sortedDebts = debtSummary?.debts
    ? [...debtSummary.debts].sort((a, b) =>
        strategy === 'Avalanche'
          ? a.priority_Avalanche - b.priority_Avalanche
          : a.priority_Snowball - b.priority_Snowball
      )
    : [];

  const simulation = useDebtSimulation(sortedDebts);

  const handleSettle = async (transactionId: number) => {
    setSettlingId(transactionId);
    const toastId = toast.loading('Quitando parcelas...');

    try {
      await settleInstallments(transactionId);
      toast.success('Parcelas quitadas com sucesso!', { id: toastId });
      refetch();
    } catch {
      toast.error('Não foi possível quitar as parcelas.', { id: toastId });
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="text-green-500" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-white">Planejamento de Dívidas</h2>
            <p className="text-slate-400">
              Escolha uma estratégia e quite suas dívidas de forma inteligente.
            </p>
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

      {!isLoading && debtSummary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <SummaryCard
              label="Total em dívidas"
              value={formatBRL(debtSummary.totalDebt)}
              accent="red"
            />
            <SummaryCard
              label="Compromisso mensal"
              value={formatBRL(debtSummary.totalMonthlyPayment)}
              accent="blue"
            />
          </div>

          {sortedDebts.length > 0 && (
            <DebtSimulationPanel
              debts={sortedDebts}
              selectedIds={simulation.selectedIds}
              onToggle={simulation.toggleDebt}
              onSelectAll={simulation.selectAll}
              onClearAll={simulation.clearAll}
              freedMonthlyAmount={simulation.freedMonthlyAmount}
              totalSavings={simulation.totalSavings}
            />
          )}

          <div className="flex flex-wrap gap-2 mb-5">
            {(Object.keys(STRATEGY_LABELS) as DebtStrategy[]).map((key) => (
              <button
                key={key}
                onClick={() => setStrategy(key)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  strategy === key
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {STRATEGY_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="mb-5">
            <StrategyExplanationCard strategy={strategy} />
          </div>

          {sortedDebts.length === 0 ? (
            <EmptyDebtsState />
          ) : (
            <div className="space-y-4">
              {sortedDebts.map((debt, index) => (
                <DebtItemCard
                  key={debt.transactionId}
                  debt={debt}
                  rank={index + 1}
                  onSettle={handleSettle}
                  isSettling={settlingId === debt.transactionId}
                />
              ))}
            </div>
          )}

          {sortedDebts.length > 0 && (
            <div className="mt-6 bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-300 text-sm">
                Seguindo a estratégia{' '}
                <span className="text-white font-semibold">{STRATEGY_LABELS[strategy]}</span>, você
                ficará livre de dívidas em aproximadamente{' '}
                <span className="text-green-400 font-bold">
                  {debtSummary.estimatedMonthsToFreedom} meses
                </span>
                .
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
