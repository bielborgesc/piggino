import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_BUTTON_CLASSES: Record<NonNullable<ConfirmModalProps['confirmVariant']>, string> = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-orange-500 hover:bg-orange-600 text-white',
  primary: 'bg-green-600 hover:bg-green-700 text-white',
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-slate-800 rounded-xl w-full max-w-sm border border-slate-700 shadow-xl flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 px-6 pt-6 pb-4">
          <h2 className="text-white font-bold text-lg mb-2">{title}</h2>
          <p className="text-slate-400 text-sm">{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${CONFIRM_BUTTON_CLASSES[confirmVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
