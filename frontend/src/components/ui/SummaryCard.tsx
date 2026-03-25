interface SummaryCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

export function SummaryCard({ label, value, valueClassName = 'text-white' }: SummaryCardProps) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h4 className="text-slate-400 text-sm">{label}</h4>
      <p className={`text-2xl font-bold mt-1 ${valueClassName}`}>{value}</p>
    </div>
  );
}
