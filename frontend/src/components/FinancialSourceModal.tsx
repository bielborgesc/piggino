import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { FinancialSource, FinancialSourceData } from '../types';
import { createFinancialSource, updateFinancialSource } from '../services/api';
import { FinancialSourceForm } from './FinancialSourceForm';

interface FinancialSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  sourceToEdit?: FinancialSource | null;
}

export function FinancialSourceModal({ isOpen, onClose, onSaveSuccess, sourceToEdit }: FinancialSourceModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (data: FinancialSourceData) => {
    setIsSaving(true);
    const toastId = toast.loading(sourceToEdit ? 'Atualizando fonte...' : 'Criando fonte...');

    try {
      if (sourceToEdit) {
        await updateFinancialSource(sourceToEdit.id, data);
        toast.success('Fonte atualizada!', { id: toastId });
      } else {
        await createFinancialSource(data);
        toast.success('Fonte criada!', { id: toastId });
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Falha ao salvar fonte financeira:', error);
      toast.error('Não foi possível salvar a fonte financeira.', { id: toastId });
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
            {sourceToEdit ? 'Editar Fonte Financeira' : 'Nova Fonte Financeira'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <FinancialSourceForm 
          onSave={handleSave}
          onCancel={onClose}
          initialData={sourceToEdit}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}