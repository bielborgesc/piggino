import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { TransactionForm } from './TransactionForm';
import { Transaction, TransactionData, RecurrenceScope } from '../../../types';
import { createTransaction, updateTransaction, updateInstallmentsByScope } from '../../../services/api';
import { extractErrorMessage } from '../../../utils/errors';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  recurrenceScope?: RecurrenceScope;
  installmentScope?: RecurrenceScope;
  installmentNumber?: number;
}

export function TransactionModal({
  isOpen,
  onClose,
  transactionToEdit,
  recurrenceScope,
  installmentScope,
  installmentNumber,
}: TransactionModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const isInstallmentEdit = installmentScope !== undefined && installmentNumber !== undefined;

  const handleSave = async (data: TransactionData, id?: number) => {
    setIsSaving(true);
    const toastId = toast.loading(id ? 'Atualizando transacao...' : 'Salvando transacao...');

    try {
      if (id && isInstallmentEdit) {
        await updateInstallmentsByScope(id, installmentNumber, data, installmentScope);
        toast.success('Parcelas atualizadas!', { id: toastId });
      } else if (id) {
        const dataWithScope: TransactionData = { ...data, recurrenceScope };
        await updateTransaction(id, dataWithScope);
        toast.success('Transacao atualizada!', { id: toastId });
      } else {
        await createTransaction(data);
        toast.success('Transacao salva!', { id: toastId });
      }
      onClose();
    } catch (error) {
      const message = extractErrorMessage(error, 'Falha ao salvar a transacao. Tente novamente.');
      toast.error(message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {transactionToEdit ? 'Editar Transacao' : 'Adicionar Transacao'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          <TransactionForm
            onSave={handleSave}
            onCancel={onClose}
            initialData={transactionToEdit}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
