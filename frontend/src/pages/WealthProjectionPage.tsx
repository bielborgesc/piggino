import { useState, useMemo, useEffect } from 'react';
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

// --- Constants ---

const DEFAULT_INITIAL_VALUE = 0;
const DEFAULT_MONTHLY_CONTRIBUTION = 500;
const DEFAULT_ANNUAL_RATE = 10;
const DEFAULT_PERIOD_YEARS = 10;
const MIN_PERIOD_YEARS = 1;
const MAX_PERIOD_YEARS = 30;
const MONTHS_PER_YEAR = 12;
const RULE_OF_72_CONSTANT = 72;
const LONG_TERM_THRESHOLD_YEARS = 20;
const CDI_ADVANTAGE_THRESHOLD_PERCENT = 20;

const BACEN_SELIC_URL =
  'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';

const SELIC_POUPANCA_THRESHOLD_PERCENT = 8.5;
const POUPANCA_FIXED_MONTHLY_RATE = 0.005;

// IR brackets by holding period in months (renda fixa — regressivo)
const IR_BRACKET_MONTH_6 = 6;
const IR_BRACKET_MONTH_12 = 12;
const IR_BRACKET_MONTH_24 = 24;

const IR_RATE_UP_TO_6_MONTHS = 0.225;
const IR_RATE_UP_TO_12_MONTHS = 0.2;
const IR_RATE_UP_TO_24_MONTHS = 0.175;
const IR_RATE_ABOVE_24_MONTHS = 0.15;

// --- External API types ---

interface BacenDataPoint {
  data: string;
  valor: string;
}

// --- CDI fetch state machine ---

type CdiStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'loaded'; rate: number; date: string }
  | { kind: 'error' };

type TableMode = 'monthly' | 'yearly';

// --- Domain interfaces ---

interface ProjectionDataPoint {
  month: number;
  year: number;
  withInterest: number;
  withoutInterest: number;
  netCDI: number;
  poupanca: number;
}

interface YearlyBreakdownRow {
  year: number;
  totalContributed: number;
  netCDI: number;
  poupanca: number;
}

interface MonthlyBreakdownRow {
  month: number;
  totalContributed: number;
  poupanca: number;
  netCDI: number;
}

// --- Pure helper functions ---

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

/**
 * Returns the IR rate for renda fixa based on the total holding period in months.
 * Brackets are defined by the Brazilian regressive IR table.
 */
function getIRRate(totalMonths: number): number {
  if (totalMonths <= IR_BRACKET_MONTH_6) return IR_RATE_UP_TO_6_MONTHS;
  if (totalMonths <= IR_BRACKET_MONTH_12) return IR_RATE_UP_TO_12_MONTHS;
  if (totalMonths <= IR_BRACKET_MONTH_24) return IR_RATE_UP_TO_24_MONTHS;
  return IR_RATE_ABOVE_24_MONTHS;
}

/**
 * Computes the annual poupança rate based on the Brazilian rule:
 * - Selic > 8.5%: poupança earns 0.5%/month compounded (fixed)
 * - Selic <= 8.5%: poupança earns 70% of Selic annually
 */
function computePoupancaAnnualRate(selicAnnualPercent: number): number {
  if (selicAnnualPercent > SELIC_POUPANCA_THRESHOLD_PERCENT) {
    return (Math.pow(1 + POUPANCA_FIXED_MONTHLY_RATE, MONTHS_PER_YEAR) - 1) * 100;
  }
  return selicAnnualPercent * 0.7;
}

/**
 * Parses the valor string from the BACEN API, handling both comma and dot
 * as decimal separators.
 */
function parseBacenRate(valor: string): number {
  return parseFloat(valor.replace(',', '.'));
}

function buildProjectionData(
  initialValue: number,
  monthlyContribution: number,
  monthlyRate: number,
  poupancaMonthlyRate: number,
  periodYears: number
): ProjectionDataPoint[] {
  const totalMonths = periodYears * MONTHS_PER_YEAR;
  const points: ProjectionDataPoint[] = [];

  for (let month = 0; month <= totalMonths; month++) {
    const withInterest = computeFutureValue(initialValue, monthlyContribution, monthlyRate, month);
    const withoutInterest = initialValue + monthlyContribution * month;
    const year = Math.floor(month / MONTHS_PER_YEAR);

    const grossEarnings = withInterest - withoutInterest;
    const irRate = getIRRate(month);
    const netEarnings = grossEarnings * (1 - irRate);
    const netCDI = withoutInterest + netEarnings;

    const poupanca = computeFutureValue(
      initialValue,
      monthlyContribution,
      poupancaMonthlyRate,
      month
    );

    points.push({ month, year, withInterest, withoutInterest, netCDI, poupanca });
  }

  return points;
}

function buildYearlyBreakdown(projectionData: ProjectionDataPoint[]): YearlyBreakdownRow[] {
  const rows: YearlyBreakdownRow[] = [];
  const maxYear = Math.max(...projectionData.map((p) => p.year));

  for (let year = 1; year <= maxYear; year++) {
    const monthIndex = year * MONTHS_PER_YEAR;
    const dataPoint = projectionData.find((p) => p.month === monthIndex);

    if (!dataPoint) continue;

    rows.push({
      year,
      totalContributed: dataPoint.withoutInterest,
      netCDI: dataPoint.netCDI,
      poupanca: dataPoint.poupanca,
    });
  }

  return rows;
}

function buildMonthlyFirstYear(projectionData: ProjectionDataPoint[]): MonthlyBreakdownRow[] {
  return projectionData
    .filter((p) => p.month >= 1 && p.month <= MONTHS_PER_YEAR)
    .map((p) => ({
      month: p.month,
      totalContributed: p.withoutInterest,
      poupanca: p.poupanca,
      netCDI: p.netCDI,
    }));
}

// --- Sub-components ---

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
      <p className="text-slate-400 text-xs sm:text-sm mb-1">{label}</p>
      <p className={`text-lg sm:text-2xl font-bold break-all ${valueColor}`}>{value}</p>
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

function formatPercent(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Hero Comparison Card ---

function HeroComparisonCard({
  cdiEarnings,
  poupancaEarnings,
  periodYears,
}: {
  cdiEarnings: number;
  poupancaEarnings: number;
  periodYears: number;
}) {
  const difference = cdiEarnings - poupancaEarnings;
  const differencePercent =
    poupancaEarnings > 0 ? (difference / poupancaEarnings) * 100 : 0;
  const differenceSign = difference >= 0 ? '+' : '';

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700">
        <p className="text-slate-400 text-sm">
          Comparativo ao final de{' '}
          <span className="text-white font-semibold">{periodYears} {periodYears === 1 ? 'ano' : 'anos'}</span>
          {' '}— quanto seu dinheiro rendeu em cada aplicacao
        </p>
      </div>
      <div className="divide-y divide-slate-700">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-slate-300 text-sm">No CDI, voce teria ganho</span>
          <span className="text-green-400 font-bold text-lg">{formatBRL(cdiEarnings)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-slate-300 text-sm">Na poupanca, voce ganharia</span>
          <span className="text-blue-400 font-bold text-lg">{formatBRL(poupancaEarnings)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-4 bg-emerald-950/40">
          <span className="text-emerald-300 text-sm font-medium">Diferenca a seu favor</span>
          <span className="text-emerald-400 font-bold text-lg">
            {formatBRL(difference)}{' '}
            <span className="text-emerald-500 text-sm font-normal">
              ({differenceSign}{formatPercent(differencePercent)}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Insight Box ---

function InsightBox({
  cdiEarnings,
  poupancaEarnings,
  periodYears,
}: {
  cdiEarnings: number;
  poupancaEarnings: number;
  periodYears: number;
}) {
  const differencePercent =
    poupancaEarnings > 0 ? ((cdiEarnings - poupancaEarnings) / poupancaEarnings) * 100 : 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 space-y-2">
      {differencePercent > CDI_ADVANTAGE_THRESHOLD_PERCENT && (
        <p className="text-slate-300 text-sm">
          Ao longo de{' '}
          <span className="text-white font-semibold">{periodYears} {periodYears === 1 ? 'ano' : 'anos'}</span>
          , o CDI rende aproximadamente{' '}
          <span className="text-green-400 font-semibold">{formatPercent(differencePercent)}% a mais</span>{' '}
          que a poupanca no mesmo periodo.
        </p>
      )}
      <p className="text-slate-300 text-sm">
        A poupanca e isenta de Imposto de Renda. O CDI desconta entre 15% e 22,5% sobre os
        rendimentos, mas ainda costuma render mais — especialmente a longo prazo.
      </p>
    </div>
  );
}

// --- Tax Info Panel ---

function TaxInfoPanel() {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
      <h4 className="text-white font-semibold text-sm mb-3">Tabela de IR — Renda Fixa</h4>
      <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-1 text-sm max-w-xs sm:max-w-sm">
        <span className="text-slate-400">Ate 180 dias</span>
        <span className="text-slate-200 font-medium">22,5%</span>
        <span className="text-slate-400">181 a 360 dias</span>
        <span className="text-slate-200 font-medium">20,0%</span>
        <span className="text-slate-400">361 a 720 dias</span>
        <span className="text-slate-200 font-medium">17,5%</span>
        <span className="text-slate-400">Acima de 720 dias</span>
        <span className="text-slate-200 font-medium">15,0%</span>
        <span className="text-slate-400">Poupanca</span>
        <span className="text-blue-400 font-medium">Isento</span>
      </div>
      <p className="text-slate-500 text-xs mt-3">
        IOF: aplicavel apenas nos primeiros 30 dias (0% apos 30 dias). Os valores da tabela acima
        assumem resgate apos 30 dias.
      </p>
    </div>
  );
}

// --- Table Mode Toggle ---

function TableModeToggle({
  mode,
  onChange,
}: {
  mode: TableMode;
  onChange: (mode: TableMode) => void;
}) {
  return (
    <div className="flex gap-2 p-4 border-b border-slate-700">
      <button
        onClick={() => onChange('monthly')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          mode === 'monthly'
            ? 'bg-green-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:text-slate-200'
        }`}
      >
        Mes a mes (1 ano)
      </button>
      <button
        onClick={() => onChange('yearly')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          mode === 'yearly'
            ? 'bg-green-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:text-slate-200'
        }`}
      >
        Ano a ano
      </button>
    </div>
  );
}

// --- Monthly Table ---

function MonthlyTable({ rows }: { rows: MonthlyBreakdownRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm whitespace-nowrap">
        <thead className="bg-slate-700">
          <tr>
            <th className="px-3 sm:px-4 py-3 text-left text-slate-300 font-semibold">Mes</th>
            <th className="px-3 sm:px-4 py-3 text-right text-slate-300 font-semibold">
              Total investido
            </th>
            <th className="px-3 sm:px-4 py-3 text-right text-blue-400 font-semibold">Poupanca</th>
            <th className="px-3 sm:px-4 py-3 text-right text-green-400 font-semibold">
              CDI (apos impostos)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const cdiIsHigher = row.netCDI >= row.poupanca;
            return (
              <tr key={row.month} className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                <td className="px-3 sm:px-4 py-3 text-slate-200">Mes {row.month}</td>
                <td className="px-3 sm:px-4 py-3 text-right text-slate-300">
                  {formatBRL(row.totalContributed)}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-blue-400">
                  {formatBRL(row.poupanca)}
                </td>
                <td
                  className={`px-3 sm:px-4 py-3 text-right font-semibold ${
                    cdiIsHigher ? 'text-green-400' : 'text-slate-300'
                  }`}
                >
                  {formatBRL(row.netCDI)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Yearly Table ---

function YearlyTable({ rows }: { rows: YearlyBreakdownRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm whitespace-nowrap">
        <thead className="bg-slate-700">
          <tr>
            <th className="px-3 sm:px-4 py-3 text-left text-slate-300 font-semibold">Ano</th>
            <th className="px-3 sm:px-4 py-3 text-right text-slate-300 font-semibold">
              Total investido
            </th>
            <th className="px-3 sm:px-4 py-3 text-right text-blue-400 font-semibold">Poupanca</th>
            <th className="px-3 sm:px-4 py-3 text-right text-green-400 font-semibold">
              CDI (apos impostos)
            </th>
            <th className="px-3 sm:px-4 py-3 text-right text-emerald-400 font-semibold">
              Diferenca
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const difference = row.netCDI - row.poupanca;
            const isPositive = difference >= 0;
            return (
              <tr key={row.year} className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                <td className="px-3 sm:px-4 py-3 text-slate-200">{row.year}</td>
                <td className="px-3 sm:px-4 py-3 text-right text-slate-300">
                  {formatBRL(row.totalContributed)}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-blue-400">
                  {formatBRL(row.poupanca)}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-green-400 font-semibold">
                  {formatBRL(row.netCDI)}
                </td>
                <td
                  className={`px-3 sm:px-4 py-3 text-right font-semibold ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {formatBRL(difference)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Page component ---

export function WealthProjectionPage() {
  const [initialValue, setInitialValue] = useState(DEFAULT_INITIAL_VALUE);
  const [monthlyContribution, setMonthlyContribution] = useState(DEFAULT_MONTHLY_CONTRIBUTION);
  const [annualRate, setAnnualRate] = useState(DEFAULT_ANNUAL_RATE);
  const [periodYears, setPeriodYears] = useState(DEFAULT_PERIOD_YEARS);
  const [cdiStatus, setCdiStatus] = useState<CdiStatus>({ kind: 'idle' });
  const [tableMode, setTableMode] = useState<TableMode>('monthly');

  // Fetch the current Selic/CDI rate from BACEN on mount
  useEffect(() => {
    setCdiStatus({ kind: 'loading' });

    fetch(BACEN_SELIC_URL)
      .then((response) => {
        if (!response.ok) throw new Error('BACEN API request failed');
        return response.json() as Promise<BacenDataPoint[]>;
      })
      .then((data) => {
        const point = data[0];
        if (!point) throw new Error('Empty response from BACEN');

        const rate = parseBacenRate(point.valor);
        setCdiStatus({ kind: 'loaded', rate, date: point.data });
        setAnnualRate(rate);
      })
      .catch(() => {
        setCdiStatus({ kind: 'error' });
      });
  }, []);

  const poupancaAnnualRate = useMemo(
    () => computePoupancaAnnualRate(annualRate),
    [annualRate]
  );

  const monthlyRate = useMemo(() => computeMonthlyRate(annualRate), [annualRate]);
  const poupancaMonthlyRate = useMemo(
    () => computeMonthlyRate(poupancaAnnualRate),
    [poupancaAnnualRate]
  );

  const projectionData = useMemo(
    () =>
      buildProjectionData(
        initialValue,
        monthlyContribution,
        monthlyRate,
        poupancaMonthlyRate,
        periodYears
      ),
    [initialValue, monthlyContribution, monthlyRate, poupancaMonthlyRate, periodYears]
  );

  const finalDataPoint = projectionData[projectionData.length - 1];
  const finalGrossValue = finalDataPoint?.withInterest ?? 0;
  const finalNetCDI = finalDataPoint?.netCDI ?? 0;
  const finalPoupanca = finalDataPoint?.poupanca ?? 0;
  const totalContributed = finalDataPoint?.withoutInterest ?? 0;
  const totalEarnings = finalGrossValue - totalContributed;
  const earningsPercent = totalContributed > 0 ? (totalEarnings / totalContributed) * 100 : 0;

  const cdiEarnings = finalNetCDI - totalContributed;
  const poupancaEarnings = finalPoupanca - totalContributed;

  const yearlyBreakdown = useMemo(() => buildYearlyBreakdown(projectionData), [projectionData]);
  const monthlyFirstYear = useMemo(() => buildMonthlyFirstYear(projectionData), [projectionData]);

  const doubleYears = annualRate > 0 ? Math.round(RULE_OF_72_CONSTANT / annualRate) : null;
  const compoundSharePercent =
    finalGrossValue > 0 ? Math.round((totalEarnings / finalGrossValue) * 100) : 0;

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
        {/* Parameters panel */}
        <div className="lg:col-span-1 bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-5">
          <h3 className="text-white font-semibold text-lg">Parametros</h3>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Quanto voce ja tem guardado (R$)
            </label>
            <input
              type="number"
              min={0}
              value={initialValue}
              onChange={(e) => setInitialValue(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Quanto vai guardar por mes (R$)
            </label>
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
              Taxa CDI (% ao ano)
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
            <p className="text-slate-500 text-xs mt-1">
              Valor atualizado automaticamente do Banco Central
            </p>

            {/* CDI status badge */}
            {cdiStatus.kind === 'loading' && (
              <p className="text-slate-400 text-xs mt-1 animate-pulse">
                Carregando CDI automaticamente...
              </p>
            )}
            {cdiStatus.kind === 'loaded' && (
              <p className="text-green-400 text-xs mt-1">
                CDI: {formatPercent(cdiStatus.rate)}% ao ano (atualizado em {cdiStatus.date})
              </p>
            )}
            {cdiStatus.kind === 'error' && (
              <p className="text-amber-400 text-xs mt-1">
                Nao foi possivel obter o CDI automaticamente. Insira manualmente.
              </p>
            )}
          </div>

          {/* Poupanca read-only badge */}
          <div className="bg-slate-700 rounded-lg px-3 py-2 border border-slate-600">
            <p className="text-blue-400 text-xs font-medium">
              Poupanca: {formatPercent(poupancaAnnualRate)}% ao ano (isenta de imposto)
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Por quanto tempo:{' '}
              <span className="text-white font-semibold">{periodYears} {periodYears === 1 ? 'ano' : 'anos'}</span>
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

        {/* Summary cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryCard label="CDI (o que voce recebe)" value={formatBRL(finalNetCDI)} accent="green" />
            <SummaryCard label="Total investido" value={formatBRL(totalContributed)} />
            <SummaryCard label="Poupanca" value={formatBRL(finalPoupanca)} accent="blue" />
            <SummaryCard label="Rendimento bruto" value={formatBRL(totalEarnings)} accent="blue" />
            <SummaryCard
              label="Rendimento total %"
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
              <span className="text-white font-semibold">{periodYears} {periodYears === 1 ? 'ano' : 'anos'}</span> voce tera{' '}
              <span className="text-emerald-400 font-semibold">{formatBRL(finalNetCDI)}</span>{' '}
              no CDI ou{' '}
              <span className="text-blue-400 font-semibold">{formatBRL(finalPoupanca)}</span>{' '}
              na poupanca.
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

      {/* Hero comparison card */}
      <div className="mb-4">
        <HeroComparisonCard
          cdiEarnings={cdiEarnings}
          poupancaEarnings={poupancaEarnings}
          periodYears={periodYears}
        />
      </div>

      {/* Plain-language insight */}
      <div className="mb-6">
        <InsightBox
          cdiEarnings={cdiEarnings}
          poupancaEarnings={poupancaEarnings}
          periodYears={periodYears}
        />
      </div>

      {/* Tax reference table */}
      <TaxInfoPanel />

      {/* Chart */}
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
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number, name: string) => [formatBRL(value), name]}
              labelFormatter={(label: number) => `Ano ${label}`}
            />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
            <Line
              type="monotone"
              dataKey="withInterest"
              name="CDI (bruto)"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="netCDI"
              name="CDI (o que voce recebe)"
              stroke="#34d399"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="poupanca"
              name="Poupanca"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="withoutInterest"
              name="Sem rendimento"
              stroke="#64748b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dual-mode breakdown table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-0">
          <h3 className="text-white font-semibold">Evolucao detalhada</h3>
        </div>
        <TableModeToggle mode={tableMode} onChange={setTableMode} />
        {tableMode === 'monthly' ? (
          <MonthlyTable rows={monthlyFirstYear} />
        ) : (
          <YearlyTable rows={yearlyBreakdown} />
        )}
      </div>
    </div>
  );
}
