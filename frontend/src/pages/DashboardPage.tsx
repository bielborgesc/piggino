import { useState, useEffect } from 'react';
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
import { LoaderCircle, TrendingUp, TrendingDown, Scale, AlertCircle, ChevronLeft, ChevronRight, Target, X, ChevronDown, ChevronUp } from 'lucide-react';
import { TransactionModal } from '../components/features/transactions/TransactionModal';
import { useDashboard } from '../hooks/useDashboard';
import { useBudgetAnalysis } from '../hooks/useBudgetAnalysis';
import { useGoals } from '../hooks/useGoals';
import { useHealthScore } from '../hooks/useHealthScore';
import { useContextualTips } from '../hooks/useContextualTips';
import { getCategories, getUserSettings } from '../services/api';
import { Category, MonthlySummary, CategoryExpense, TopExpense, BudgetAnalysis, BucketCategoryBreakdown, Goal } from '../types';
import { formatBRL } from '../utils/formatters';

const MONTH_COUNT = 6;
const DEFAULT_CATEGORY_COLOR = '#6b7280';

const BUCKET_NEEDS_COLOR = '#3b82f6';
const BUCKET_WANTS_COLOR = '#a855f7';
const BUCKET_SAVINGS_COLOR = '#22c55e';

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthKeyLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

const FALLBACK_CATEGORY_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
];

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('pt-BR', { month: 'short' });
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  valueClassName: string;
  trend?: {
    percent: number;
    positiveIsGood: boolean;
  };
}

function KpiCard({ title, value, icon, valueClassName, trend }: KpiCardProps) {
  const trendColor = trend
    ? trend.percent > 0
      ? trend.positiveIsGood ? 'text-green-400' : 'text-red-400'
      : trend.percent < 0
        ? trend.positiveIsGood ? 'text-red-400' : 'text-green-400'
        : 'text-slate-400'
    : '';

  const TrendIcon = trend && trend.percent > 0 ? TrendingUp : TrendingDown;
  const trendLabel = trend
    ? `${trend.percent > 0 ? '+' : ''}${trend.percent.toFixed(1)}%`
    : null;

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex items-start gap-4">
      <div className="mt-1 text-slate-400">{icon}</div>
      <div>
        <p className="text-slate-400 text-sm">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${valueClassName}`}>{value}</p>
        {trend && trend.percent !== 0 && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={12} />
            <span>{trendLabel} vs mes anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Health Score Widget ---

const HEALTH_SCORE_RING_RADIUS = 54;
const HEALTH_SCORE_RING_CIRCUMFERENCE = 2 * Math.PI * HEALTH_SCORE_RING_RADIUS;

function resolveHealthScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function HealthScoreWidget() {
  const { healthScore, isLoading } = useHealthScore();

  if (isLoading || !healthScore) return null;

  const ringOffset = HEALTH_SCORE_RING_CIRCUMFERENCE * (1 - healthScore.score / 100);
  const ringColor = resolveHealthScoreColor(healthScore.score);

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-5">
      <h3 className="text-base font-semibold text-white">Score de Saude Financeira</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={HEALTH_SCORE_RING_RADIUS}
              fill="none"
              stroke="#334155"
              strokeWidth="12"
            />
            <circle
              cx="70"
              cy="70"
              r={HEALTH_SCORE_RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={HEALTH_SCORE_RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 70 70)"
            />
            <text x="70" y="64" textAnchor="middle" fill={ringColor} fontSize="28" fontWeight="bold" dominantBaseline="middle">
              {healthScore.grade}
            </text>
            <text x="70" y="88" textAnchor="middle" fill="#94a3b8" fontSize="11" dominantBaseline="middle">
              {healthScore.gradeLabel}
            </text>
            <text x="70" y="104" textAnchor="middle" fill="#64748b" fontSize="10" dominantBaseline="middle">
              {healthScore.score}/100
            </text>
          </svg>
        </div>

        <div className="flex-1 w-full space-y-3">
          {healthScore.components.map((component) => {
            const pct = Math.round((component.score / component.maxScore) * 100);
            const barColor = resolveHealthScoreColor(Math.round((component.score / component.maxScore) * 100));
            return (
              <div key={component.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{component.name}</span>
                  <span className="text-slate-400">{component.score}/{component.maxScore}</span>
                </div>
                <div className="w-full bg-gray-700 rounded h-2">
                  <div
                    className="h-2 rounded transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <p className="text-xs text-slate-500">{component.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {(healthScore.strengths.length > 0 || healthScore.warnings.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-700">
          {healthScore.strengths.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">Pontos Fortes</p>
              <ul className="space-y-1">
                {healthScore.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1">
                    <span className="shrink-0">✅</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {healthScore.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Pontos de Atencao</p>
              <ul className="space-y-1">
                {healthScore.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1">
                    <span className="shrink-0">⚠️</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Contextual Tips Widget ---

const MAX_VISIBLE_TIPS = 4;

const TIP_PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function resolveTipBorderColor(priority: string): string {
  if (priority === 'high') return 'border-red-500';
  if (priority === 'medium') return 'border-yellow-500';
  return 'border-green-500';
}

function ContextualTipsWidget() {
  const { tipsData, isLoading } = useContextualTips();
  const [showAll, setShowAll] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  if (isLoading || !tipsData || tipsData.tips.length === 0) return null;

  const sorted = [...tipsData.tips].sort(
    (a, b) => (TIP_PRIORITY_ORDER[a.priority] ?? 3) - (TIP_PRIORITY_ORDER[b.priority] ?? 3)
  );

  const hasHighPriority = sorted.some((t) => t.priority === 'high');

  const visibleTips = showAll ? sorted : sorted.slice(0, MAX_VISIBLE_TIPS);
  const hiddenCount = sorted.length - MAX_VISIBLE_TIPS;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <h3 className="text-base font-semibold text-white">Dicas Personalizadas</h3>
        <div className="flex items-center gap-2">
          {hasHighPriority && (
            <span className="bg-red-900/50 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-800">
              {sorted.filter((t) => t.priority === 'high').length} urgente(s)
            </span>
          )}
          {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-3">
          {visibleTips.map((tip, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg bg-slate-700/50 border-l-4 ${resolveTipBorderColor(tip.priority)}`}
            >
              <span className="text-xl shrink-0 mt-0.5">{tip.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{tip.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tip.message}</p>
              </div>
            </div>
          ))}

          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-sm text-green-400 hover:text-green-300 font-medium py-1 transition-colors"
            >
              Ver mais {hiddenCount} dica(s)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BrlTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatBRL(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}

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

interface CategoryPieChartProps {
  categories: CategoryExpense[];
  categoryColorMap: Map<string, string>;
}

function resolveCategoryColor(name: string, index: number, colorMap: Map<string, string>): string {
  return colorMap.get(name) ?? FALLBACK_CATEGORY_COLORS[index % FALLBACK_CATEGORY_COLORS.length];
}

function CategoryPieChart({ categories, categoryColorMap }: CategoryPieChartProps) {
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
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={resolveCategoryColor(entry.name, index, categoryColorMap)}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: ValueType) => [formatBRL(Number(value)), '']}
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
                style={{ backgroundColor: resolveCategoryColor(entry.name, index, categoryColorMap) }}
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
            <span className="text-red-400 font-semibold text-sm shrink-0">{formatBRL(expense.amount)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface BucketBarProps {
  label: string;
  actual: number;
  target: number;
  color: string;
  categories: BucketCategoryBreakdown[];
}

function BucketBar({ label, actual, target, color, categories }: BucketBarProps) {
  const percentage = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const isOverTarget = actual > target;
  const surplus = target - actual;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white font-semibold">{label}</span>
        <span className={isOverTarget ? 'text-red-400 font-semibold' : 'text-slate-300'}>
          {formatBRL(actual)} / {formatBRL(target)}
          <span className={`ml-2 text-xs ${isOverTarget ? 'text-red-400' : 'text-slate-400'}`}>
            ({isOverTarget ? `+${formatBRL(Math.abs(surplus))}` : `-${formatBRL(Math.abs(surplus))}`})
          </span>
        </span>
      </div>
      <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOverTarget ? '#ef4444' : color,
          }}
        />
      </div>
      {categories.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          {categories.map((cat) => (
            <li key={cat.categoryName} className="flex items-center gap-1 text-xs text-slate-400">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.categoryColor }}
              />
              {cat.categoryName}: {formatBRL(cat.amount)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface BudgetAnalysisSectionProps {
  month: string;
  onMonthChange: (month: string) => void;
  onNavigateToCategories: () => void;
}

function BudgetAnalysisSection({ month, onMonthChange, onNavigateToCategories }: BudgetAnalysisSectionProps) {
  const { analysis, isLoading, error } = useBudgetAnalysis(month);

  const hasMissingIncome = analysis !== null && analysis.monthlyIncome <= 0;

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Analise 50/30/20</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-slate-300 text-sm font-medium w-36 text-center capitalize">
            {formatMonthKeyLabel(month)}
          </span>
          <button
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Proximo mes"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <LoaderCircle className="animate-spin text-green-500" size={28} />
        </div>
      )}

      {!isLoading && error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {!isLoading && !error && analysis && (
        <>
          {hasMissingIncome && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 text-amber-300 text-sm">
              Nenhuma receita registrada neste mes. Adicione receitas para ver a analise.
            </div>
          )}

          {analysis.unclassifiedActual > 0 && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 text-amber-300 text-sm flex items-start justify-between gap-3">
              <span>
                {formatBRL(analysis.unclassifiedActual)} em despesas sem classificacao 50/30/20.
              </span>
              <button
                onClick={onNavigateToCategories}
                className="text-amber-200 underline hover:text-white shrink-0 text-xs"
              >
                Classificar categorias
              </button>
            </div>
          )}

          <div className="space-y-5">
            <BucketBar
              label="Necessidades (50%)"
              actual={analysis.needsActual}
              target={analysis.needsTarget}
              color={BUCKET_NEEDS_COLOR}
              categories={analysis.needsCategories}
            />
            <BucketBar
              label="Desejos (30%)"
              actual={analysis.wantsActual}
              target={analysis.wantsTarget}
              color={BUCKET_WANTS_COLOR}
              categories={analysis.wantsCategories}
            />
            <BucketBar
              label="Reservas (20%)"
              actual={analysis.savingsActual}
              target={analysis.savingsTarget}
              color={BUCKET_SAVINGS_COLOR}
              categories={analysis.savingsCategories}
            />
          </div>

          {analysis.insights.length > 0 && (
            <ul className="space-y-2 pt-2 border-t border-slate-700">
              {analysis.insights.map((insight, index) => (
                <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">
                    {insight.includes('Dentro') ? '✅' : insight.includes('Excedendo') || insight.includes('reduza') || insight.includes('Abaixo') ? '⚠️' : '💡'}
                  </span>
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

const OVERSPENDING_WARNING_THRESHOLD = 90;

interface BudgetBucketStatus {
  label: string;
  actual: number;
  target: number;
  usagePercentage: number;
}

function buildBucketStatuses(analysis: BudgetAnalysis): BudgetBucketStatus[] {
  return [
    { label: 'Necessidades (50%)', actual: analysis.needsActual, target: analysis.needsTarget, usagePercentage: analysis.needsTarget > 0 ? (analysis.needsActual / analysis.needsTarget) * 100 : 0 },
    { label: 'Desejos (30%)', actual: analysis.wantsActual, target: analysis.wantsTarget, usagePercentage: analysis.wantsTarget > 0 ? (analysis.wantsActual / analysis.wantsTarget) * 100 : 0 },
    { label: 'Reservas (20%)', actual: analysis.savingsActual, target: analysis.savingsTarget, usagePercentage: analysis.savingsTarget > 0 ? (analysis.savingsActual / analysis.savingsTarget) * 100 : 0 },
  ];
}

interface OverspendingAlertsProps {
  analysis: BudgetAnalysis;
  onNavigateToCategories: () => void;
}

function OverspendingAlerts({ analysis, onNavigateToCategories }: OverspendingAlertsProps) {
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  const dismiss = (key: string) => {
    setDismissedBanners((prev) => new Set(prev).add(key));
  };

  const buckets = buildBucketStatuses(analysis);
  const exceededBuckets = buckets.filter((b) => b.actual > b.target && b.target > 0);
  const nearLimitBuckets = buckets.filter((b) => b.usagePercentage >= OVERSPENDING_WARNING_THRESHOLD && b.actual <= b.target && b.target > 0);
  const hasUnclassified = analysis.unclassifiedActual > 0;

  const visibleExceeded = exceededBuckets.filter((b) => !dismissedBanners.has(`exceeded-${b.label}`));
  const visibleNearLimit = nearLimitBuckets.filter((b) => !dismissedBanners.has(`near-${b.label}`));
  const showUnclassified = hasUnclassified && !dismissedBanners.has('unclassified');

  if (visibleExceeded.length === 0 && visibleNearLimit.length === 0 && !showUnclassified) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleExceeded.map((bucket) => (
        <div key={bucket.label} className="flex items-start justify-between gap-3 bg-red-900/30 border border-red-700 rounded-lg px-4 py-3">
          <span className="text-red-300 text-sm">
            [!] Voce ultrapassou o orcamento em {bucket.label} — excedeu {formatBRL(bucket.actual - bucket.target)}
          </span>
          <button
            onClick={() => dismiss(`exceeded-${bucket.label}`)}
            className="shrink-0 text-red-400 hover:text-white transition-colors"
            aria-label="Fechar alerta"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {visibleNearLimit.map((bucket) => (
        <div key={bucket.label} className="flex items-start justify-between gap-3 bg-amber-900/30 border border-amber-700 rounded-lg px-4 py-3">
          <span className="text-amber-300 text-sm">
            [/\] Voce esta proximo do limite em {bucket.label} — {Math.round(bucket.usagePercentage)}% usado
          </span>
          <button
            onClick={() => dismiss(`near-${bucket.label}`)}
            className="shrink-0 text-amber-400 hover:text-white transition-colors"
            aria-label="Fechar alerta"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {showUnclassified && (
        <div className="flex items-start justify-between gap-3 bg-blue-900/30 border border-blue-700 rounded-lg px-4 py-3">
          <span className="text-blue-300 text-sm">
            [i] {formatBRL(analysis.unclassifiedActual)} em gastos nao classificados —{' '}
            <button
              onClick={onNavigateToCategories}
              className="underline text-blue-200 hover:text-white"
            >
              classifique suas categorias
            </button>{' '}
            para uma analise completa.
          </span>
          <button
            onClick={() => dismiss('unclassified')}
            className="shrink-0 text-blue-400 hover:text-white transition-colors"
            aria-label="Fechar alerta"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

interface BudgetAlertsBannerProps {
  budgetMonth: string;
  onNavigateToCategories: () => void;
}

function BudgetAlertsBanner({ budgetMonth, onNavigateToCategories }: BudgetAlertsBannerProps) {
  const { analysis, isLoading } = useBudgetAnalysis(budgetMonth);

  if (isLoading || !analysis) return null;

  return (
    <OverspendingAlerts
      analysis={analysis}
      onNavigateToCategories={onNavigateToCategories}
    />
  );
}

const MAX_GOALS_IN_WIDGET = 3;

interface GoalsMiniWidgetProps {
  goals: Goal[];
  onNavigateToGoals: () => void;
}

function GoalsMiniWidget({ goals, onNavigateToGoals }: GoalsMiniWidgetProps) {
  const activeGoals = goals.filter((g) => !g.isCompleted).slice(0, MAX_GOALS_IN_WIDGET);

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="text-green-400" size={18} />
          <h3 className="text-base font-semibold text-white">Metas</h3>
        </div>
        <button
          onClick={onNavigateToGoals}
          className="text-green-400 hover:text-green-300 text-xs font-semibold transition-colors"
        >
          Ver todas
        </button>
      </div>

      {activeGoals.length === 0 && (
        <p className="text-slate-400 text-sm">Nenhuma meta ativa. Crie uma meta para comecar.</p>
      )}

      <ul className="space-y-3">
        {activeGoals.map((goal) => (
          <li key={goal.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: goal.color }}
                />
                <span className="text-white truncate">{goal.name}</span>
              </div>
              <span className="text-slate-400 text-xs shrink-0 ml-2">{goal.progressPercentage}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${goal.progressPercentage}%`, backgroundColor: goal.color }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface DashboardPageProps {
  onNavigateToCategories: () => void;
  onNavigateToGoals: () => void;
}

export function DashboardPage({ onNavigateToCategories, onNavigateToGoals }: DashboardPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryColorMap, setCategoryColorMap] = useState<Map<string, string>>(new Map());
  const [is503020Enabled, setIs503020Enabled] = useState(false);
  const [budgetMonth, setBudgetMonth] = useState<string>(getCurrentMonthKey());
  const { summary, isLoading, error, refetch } = useDashboard(MONTH_COUNT);
  const { goals } = useGoals();

  useEffect(() => {
    getCategories()
      .then((cats: Category[]) => {
        const map = new Map(cats.map(c => [c.name, c.color ?? DEFAULT_CATEGORY_COLOR]));
        setCategoryColorMap(map);
      })
      .catch(() => {
        // Non-critical: fallback palette will be used
      });

    getUserSettings()
      .then((s) => setIs503020Enabled(s.is503020Enabled))
      .catch(() => {
        // Non-critical: feature stays hidden
      });
  }, []);

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
        {is503020Enabled && (
          <BudgetAlertsBanner
            budgetMonth={budgetMonth}
            onNavigateToCategories={onNavigateToCategories}
          />
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Receitas do Mes"
            value={formatBRL(summary.currentMonthIncome)}
            icon={<TrendingUp size={20} />}
            valueClassName="text-green-400"
            trend={{ percent: summary.incomeChangePercent, positiveIsGood: true }}
          />
          <KpiCard
            title="Gastos do Mes"
            value={formatBRL(summary.currentMonthExpenses)}
            icon={<TrendingDown size={20} />}
            valueClassName="text-red-400"
            trend={{ percent: summary.expensesChangePercent, positiveIsGood: false }}
          />
          <KpiCard
            title="Saldo do Mes"
            value={formatBRL(summary.currentMonthBalance)}
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

        <HealthScoreWidget />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeExpensesChart monthlySummaries={summary.monthlySummaries} />
          <CategoryPieChart categories={summary.expensesByCategory} categoryColorMap={categoryColorMap} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BalanceTrendChart monthlySummaries={summary.monthlySummaries} />
          <TopExpensesList expenses={summary.topExpenses} />
        </div>

        {is503020Enabled && (
          <BudgetAnalysisSection
            month={budgetMonth}
            onMonthChange={setBudgetMonth}
            onNavigateToCategories={onNavigateToCategories}
          />
        )}

        <ContextualTipsWidget />

        <GoalsMiniWidget goals={goals} onNavigateToGoals={onNavigateToGoals} />

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
