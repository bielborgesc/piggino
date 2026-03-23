interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">
      {message}
    </div>
  );
}
