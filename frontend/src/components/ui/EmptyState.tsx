interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-800 rounded-lg border border-slate-700">
      <div className="text-slate-500 mb-4">{icon}</div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-xs mb-6">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
