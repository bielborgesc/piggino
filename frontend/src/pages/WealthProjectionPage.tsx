import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatBRL } from '../utils/formatters';

const DEFAULT_INITIAL_VALUE = 0;
const DEFAULT_MONTHLY_CONTRIBUTION = 500;
const DEFAULT_ANNUAL_RATE = 10;
const DEFAULT_PERIOD_YEARS = 10;
const MIN_PERIOD_YEARS = 1;
const MAX_PERIOD_YEARS = 30;
const MONTHS_PER_YEAR = 12;
const RULE_OF_72_CONSTANT = 72;
const LONG_TERM_THRESHOLD_YEARS = 20;

interface ProjectionDataPoint {
  month: number;
  year: number;
  withInterest: number;
  withoutInterest: number;
}

interface YearlyBreakdownRow {
  year: number;
  accumulatedBalance: number;
  yearlyEarnings: number;
  totalContributed: number;
}

function computeMonthlyRate(annualRatePercent: number): number {
  return Math.pow(1 + annualRatePercent / 100, 1 / MONTHS_PER_YEAR) - 1;
}

function computeFutureValue(
  initialValue: number,
  monthlyContribution: number,
  monthlyRate: number,
  totalMonths: number
): number {
  if (monthlyRate === 0) {
    return initialValue + monthlyContribution * totalMonths;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const futureInitial = initialValue * compoundFactor;
  const futureContributions = monthlyContribution * ((compoundFactor - 1) / monthlyRate);

  return futureInitial + futureContributions;
}

function buildProjectionData(
  initialValue: number,
  monthlyContribution: number,
  monthlyRate: number,
  periodYears: number
): ProjectionDataPoint[] {
  const totalMonths = periodYears * MONTHS_PER_YEAR;
  const points: ProjectionDataPoint[] = [];

  for (let month = 0; month <= totalMonths; month++) {
    const withInterest = computeFutureValue(initialValue, monthlyContribution, monthlyRate, month);
    const withoutInterest = initialValue + monthlyContribution * month;
    const year = Math.floor(month / MONTHS_PER_YEAR);

    points.push({ month, year, withInterest, withoutInterest });
  }

  return points;
}

function buildYearlyBreakdown(projectionData: ProjectionDataPoint[]): YearlyBreakdownRow[] {
  const rows: YearlyBreakdownRow[] = [];
  let previousBalance = 0;

  for (let year = 1; year <= Math.max(...projectionData.map((p) => p.year)); year++) {
    const monthIndex = year * MONTHS_PER_YEAR;
    const dataPoint = projectionData.find((p) => p.month === monthIndex);

    if (!dataPoint) continue;

    const accumulatedBalance = dataPoint.withInterest;
    const yearlyEarnings = accumulatedBalance - previousBalance;
    const totalContributed = dataPoint.withoutInterest;

    rows.push({ year, accumulatedBalance, yearlyEarnings, totalContributed });
    previousBalance = accumulatedBalance;
  }

  return rows;
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'blue' | 'yellow';
}) {
  const valueColor =
    accent === 'green'
      ? 'text-green-400'
      : accent === 'blue'
      ? 'text-blue-400'
      : accent === 'yellow'
      ? 'text-yellow-400'
      : 'text-white';

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function formatChartCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
}

export function WealthProjectionPage() {
  const [initialValue, setInitialValue] = useState(DEFAULT_INITIAL_VALUE);
  const [monthlyContribution, setMonthlyContribution] = useState(DEFAULT_MONTHLY_CONTRIBUTION);
  const [annualRate, setAnnualRate] = useState(DEFAULT_ANNUAL_RATE);
  const [periodYears, setPeriodYears] = useState(DEFAULT_PERIOD_YEARS);

  const monthlyRate = useMemo(() => computeMonthlyRate(annualRate), [annualRate]);

  const projectionData = useMemo(
    () => buildProjectionData(initialValue, monthlyContribution, monthlyRate, periodYears),
    [initialValue, monthlyContribution, monthlyRate, periodYears]
  );

  const finalDataPoint = projectionData[projectionData.length - 1];
  const finalValue = finalDataPoint?.withInterest ?? 0;
  const totalContributed = finalDataPoint?.withoutInterest ?? 0;
  const totalEarnings = finalValue - totalContributed;
  const earningsPercent = totalContributed > 0 ? (totalEarnings / totalContributed) * 100 : 0;

  const yearlyBreakdown = useMemo(() => buildYearlyBreakdown(projectionData), [projectionData]);

  const doubleYears = annualRate > 0 ? Math.round(RULE_OF_72_CONSTANT / annualRate) : null;
  const compoundSharePercent =
    finalValue > 0 ? Math.round((totalEarnings / finalValue) * 100) : 0;

  const chartData = projectionData.filter((p) => p.month % MONTHS_PER_YEAR === 0 || p.month === 0);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-green-500" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-white">Projecao de Patrimonio</h2>
            <p className="text-slate-400">Simule o crescimento do seu dinheiro ao longo do tempo.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-5">
          <h3 className="text-white font-semibold text-lg">Parametros</h3>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Valor inicial (R$)</label>
            <input
              type="number"
              min={0}
              value={initialValue}
              onChange={(e) => setInitialValue(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Aporte mensal (R$)</label>
            <input
              type="number"
              min={0}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Taxa de juros anual (% a.a.)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={annualRate}
              onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Periodo: <span className="text-white font-semibold">{periodYears} anos</span>
            </label>
            <input
              type="range"
              min={MIN_PERIOD_YEARS}
              max={MAX_PERIOD_YEARS}
              value={periodYears}
              onChange={(e) => setPeriodYears(Number(e.target.value))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{MIN_PERIOD_YEARS} ano</span>
              <span>{MAX_PERIOD_YEARS} anos</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SummaryCard label="Valor final" value={formatBRL(finalValue)} accent="green" />
            <SummaryCard label="Total investido" value={formatBRL(totalContributed)} />
            <SummaryCard label="Rendimento total" value={formatBRL(totalEarnings)} accent="blue" />
            <SummaryCard
              label="Rendimento %"
              value={`${earningsPercent.toFixed(1)}%`}
              accent="yellow"
            />
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-2">
            {doubleYears !== null && (
              <p className="text-slate-300 text-sm">
                <span className="text-green-400 font-semibold">Regra dos 72:</span> Seu dinheiro
                dobrara em aproximadamente{' '}
                <span className="text-white font-semibold">{doubleYears} anos</span>.
              </p>
            )}
            <p className="text-slate-300 text-sm">
              <span className="text-blue-400 font-semibold">Projecao:</span> Com esse ritmo, em{' '}
              <span className="text-white font-semibold">{periodYears} anos</span> voce tera{' '}
              <span className="text-white font-semibold">{formatBRL(finalValue)}</span>.
            </p>
            {periodYears > LONG_TERM_THRESHOLD_YEARS && (
              <p className="text-slate-300 text-sm">
                <span className="text-yellow-400 font-semibold">Poder dos juros compostos:</span>{' '}
                Os juros compostos representam{' '}
                <span className="text-white font-semibold">{compoundSharePercent}%</span> do seu
                patrimonio final — o tempo e seu maior aliado.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
        <h3 className="text-white font-semibold mb-4">Evolucao do Patrimonio</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="year"
              stroke="#94a3b8"
              tickFormatter={(value: number) => `Ano ${value}`}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#94a3b8"
              tickFormatter={formatChartCurrency}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number, name: string) => [formatBRL(value), name]}
              labelFormatter={(label: number) => `Ano ${label}`}
            />
            <Legend
              wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }}
            />
            <Line
              type="monotone"
              dataKey="withInterest"
              name="Com juros"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="withoutInterest"
              name="Sem juros"
              stroke="#64748b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <h3 className="text-white font-semibold p-4 border-b border-slate-700">
          Evolucao anual detalhada
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Ano</th>
                <th className="px-4 py-3 text-right text-slate-300 font-semibold">
                  Saldo acumulado
                </th>
                <th className="px-4 py-3 text-right text-slate-300 font-semibold">
                  Rendimento do ano
                </th>
                <th className="px-4 py-3 text-right text-slate-300 font-semibold">
                  Total aportado
                </th>
              </tr>
            </thead>
            <tbody>
              {yearlyBreakdown.map((row, index) => (
                <tr
                  key={row.year}
                  className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}
                >
                  <td className="px-4 py-3 text-slate-200">{row.year}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-semibold">
                    {formatBRL(row.accumulatedBalance)}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-400">
                    {formatBRL(row.yearlyEarnings)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatBRL(row.totalContributed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
