import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  Area,
  ComposedChart,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { LoaderCircle, TrendingUp, TrendingDown, Scale, AlertCircle } from 'lucide-react';
import { TransactionModal } from './TransactionModal';
import { useDashboard } from '../hooks/useDashboard';
import { MonthlySummary, CategoryExpense, TopExpense } from '../types';

const MONTH_COUNT = 6;

const CATEGORY_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
];

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatBrl(value: number): string {
  return BRL_FORMATTER.format(value);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('pt-BR', { month: 'short' });
}

// --- KPI Card ---

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  valueClassName: string;
}

function KpiCard({ title, value, icon, valueClassName }: KpiCardProps) {
  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex items-start gap-4">
      <div className="mt-1 text-slate-400">{icon}</div>
      <div>
        <p className="text-slate-400 text-sm">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}

// --- Custom BRL Tooltip for Recharts ---

function BrlTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatBrl(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}

// --- Income vs Expenses Bar Chart ---

interface IncomeExpensesChartProps {
  monthlySummaries: MonthlySummary[];
}

function IncomeExpensesChart({ monthlySummaries }: IncomeExpensesChartProps) {
  const data = monthlySummaries.map((s) => ({
    month: formatMonthLabel(s.month),
    Receitas: s.totalIncome,
    Gastos: s.totalExpenses,
  }));

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
      <h3 className="text-base font-semibold text-white mb-4">Receitas vs Gastos</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<BrlTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
          <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Expenses by Category Pie Chart ---

interface CategoryPieChartProps {
  categories: CategoryExpense[];
}

function CategoryPieChart({ categories }: CategoryPieChartProps) {
  if (categories.length === 0) {
    return (
      <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex items-center justify-center h-52">
        <p className="text-slate-400 text-sm">Nenhum gasto este mes.</p>
      </div>
    );
  }

  const data = categories.map((c) => ({ name: c.categoryName, value: c.total, percentage: c.percentage }));

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
      <h3 className="text-base font-semibold text-white mb-4">Gastos por Categoria</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: ValueType) => [formatBrl(Number(value)), '']}
              contentStyle={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#f1f5f9' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="flex flex-col gap-1 text-xs w-full sm:w-auto sm:min-w-[140px]">
          {data.map((entry, index) => (
            <li key={entry.name} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
              />
              <span className="text-slate-300 truncate">{entry.name}</span>
              <span className="text-slate-400 ml-auto pl-2">{entry.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- Balance Trend Line Chart ---

interface BalanceTrendChartProps {
  monthlySummaries: MonthlySummary[];
}

function BalanceTrendChart({ monthlySummaries }: BalanceTrendChartProps) {
  const data = monthlySummaries.map((s) => ({
    month: formatMonthLabel(s.month),
    Saldo: s.balance,
  }));

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
      <h3 className="text-base font-semibold text-white mb-4">Tendencia de Saldo</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<BrlTooltip />} cursor={{ stroke: '#475569' }} />
          <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
          <Area dataKey="Saldo" fill="#22c55e22" stroke="transparent" />
          <Line dataKey="Saldo" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Top Expenses List ---

interface TopExpensesListProps {
  expenses: TopExpense[];
}

function TopExpensesList({ expenses }: TopExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
        <h3 className="text-base font-semibold text-white mb-4">Maiores Gastos do Mes</h3>
        <p className="text-slate-400 text-sm">Nenhum gasto registrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
      <h3 className="text-base font-semibold text-white mb-4">Maiores Gastos do Mes</h3>
      <ol className="space-y-3">
        {expenses.map((expense, index) => (
          <li key={`${expense.description}-${index}`} className="flex items-center gap-3">
            <span className="text-slate-500 text-sm font-mono w-5 shrink-0">{index + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{expense.description}</p>
              {expense.categoryName && (
                <p className="text-slate-400 text-xs">{expense.categoryName}</p>
              )}
            </div>
            <span className="text-red-400 font-semibold text-sm shrink-0">{formatBrl(expense.amount)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// --- Dashboard (main export) ---

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { summary, isLoading, error, refetch } = useDashboard(MONTH_COUNT);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <LoaderCircle className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 text-slate-400">
        <AlertCircle size={40} />
        <p>{error ?? 'Failed to load dashboard.'}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const handleTransactionSaved = () => {
    setIsModalOpen(false);
    refetch();
  };

  return (
    <>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Receitas do Mes"
            value={formatBrl(summary.currentMonthIncome)}
            icon={<TrendingUp size={20} />}
            valueClassName="text-green-400"
          />
          <KpiCard
            title="Gastos do Mes"
            value={formatBrl(summary.currentMonthExpenses)}
            icon={<TrendingDown size={20} />}
            valueClassName="text-red-400"
          />
          <KpiCard
            title="Saldo do Mes"
            value={formatBrl(summary.currentMonthBalance)}
            icon={<Scale size={20} />}
            valueClassName={summary.currentMonthBalance >= 0 ? 'text-white' : 'text-red-400'}
          />
          <KpiCard
            title="Contas Fixas Pendentes"
            value={String(summary.pendingFixedBills)}
            icon={<AlertCircle size={20} />}
            valueClassName={summary.pendingFixedBills > 0 ? 'text-amber-400' : 'text-white'}
          />
        </div>

        {/* Charts row — bar + pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeExpensesChart monthlySummaries={summary.monthlySummaries} />
          <CategoryPieChart categories={summary.expensesByCategory} />
        </div>

        {/* Charts row — line + top expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BalanceTrendChart monthlySummaries={summary.monthlySummaries} />
          <TopExpensesList expenses={summary.topExpenses} />
        </div>

        {/* Quick action */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300"
          >
            + Adicionar Transacao
          </button>
        </div>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={handleTransactionSaved} />
    </>
  );
}
