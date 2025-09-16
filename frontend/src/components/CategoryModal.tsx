import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { Category, CategoryData } from '../types';
import { createCategory, updateCategory } from '../services/api';
import { CategoryForm } from './CategoryForm';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  categoryToEdit?: Category | null;
}

export function CategoryModal({ isOpen, onClose, onSaveSuccess, categoryToEdit }: CategoryModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSave = async (data: CategoryData) => {
    setIsSaving(true);
    const toastId = toast.loading(categoryToEdit ? 'Atualizando categoria...' : 'Criando categoria...');

    try {
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, data);
        toast.success('Categoria atualizada!', { id: toastId });
      } else {
        await createCategory(data);
        toast.success('Categoria criada!', { id: toastId });
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Falha ao salvar categoria:', error);
      toast.error('Não foi possível salvar a categoria.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <CategoryForm 
          onSave={handleSave}
          onCancel={onClose}
          initialData={categoryToEdit}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}