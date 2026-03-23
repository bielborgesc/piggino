import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthNavigatorProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  formatOptions?: Intl.DateTimeFormatOptions;
}

const DEFAULT_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
};

export function MonthNavigator({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  formatOptions = DEFAULT_FORMAT_OPTIONS,
}: MonthNavigatorProps) {
  const label = currentDate.toLocaleString('pt-BR', formatOptions);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 bg-slate-700/50 p-2 rounded-lg">
      <button
        onClick={onPreviousMonth}
        className="p-2 rounded-md hover:bg-slate-600 transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-base sm:text-lg font-semibold w-44 text-center capitalize">
        {label}
      </span>
      <button
        onClick={onNextMonth}
        className="p-2 rounded-md hover:bg-slate-600 transition-colors"
        aria-label="Proximo mes"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
