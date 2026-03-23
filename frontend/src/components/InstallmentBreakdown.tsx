import { CardInstallment } from '../types';
import { formatBRL } from '../utils/formatters';

interface InstallmentBreakdownProps {
  installments: CardInstallment[];
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

export function InstallmentBreakdown({ installments }: InstallmentBreakdownProps) {
  const sorted = [...installments].sort((a, b) => a.installmentNumber - b.installmentNumber);

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-md mt-2 overflow-hidden">
      <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 px-4 py-2 border-b border-slate-700">
        <span>Parcela</span>
        <span>Vencimento</span>
        <span>Valor</span>
        <span>Status</span>
      </div>
      {sorted.map((installment) => (
        <div
          key={installment.id}
          className={`grid grid-cols-4 text-xs px-4 py-2 border-b border-slate-700/50 last:border-b-0 ${
            installment.isPaid ? 'text-slate-500' : 'text-slate-300'
          }`}
        >
          <span>{installment.installmentNumber}x</span>
          <span>{formatDate(installment.dueDate)}</span>
          <span className={installment.isPaid ? 'line-through' : ''}>
            {formatBRL(installment.amount)}
          </span>
          <span className={installment.isPaid ? 'text-green-500' : 'text-yellow-500'}>
            {installment.isPaid ? 'Pago' : 'Pendente'}
          </span>
        </div>
      ))}
    </div>
  );
}
