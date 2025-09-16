import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { TransactionForm } from './TransactionForm';
import { Transaction, TransactionData } from '../types';
import { createTransaction, updateTransaction } from '../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, transactionToEdit }: TransactionModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }
  
  // ✅ Lógica para decidir entre criar ou atualizar
  const handleSave = async (data: TransactionData, id?: number) => {
    setIsSaving(true);
    const toastId = toast.loading(id ? 'Atualizando transação...' : 'Salvando transação...');

    try {
      if (id) {
        await updateTransaction(id, data);
        toast.success('Transação atualizada!', { id: toastId });
      } else {
        await createTransaction(data);
        toast.success('Transação salva!', { id: toastId });
      }
      onClose();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error('Falha ao salvar a transação.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {transactionToEdit ? 'Editar Transação' : 'Adicionar Transação'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <TransactionForm 
          onSave={handleSave}
          onCancel={onClose}
          initialData={transactionToEdit}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}