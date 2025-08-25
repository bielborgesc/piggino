import React from 'react';
import { X } from 'lucide-react';
import { TransactionForm } from './TransactionForm';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    // 1. Fundo agora é semi-transparente (backdrop) e tem padding
    <div 
      className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 2. Adicionado um cabeçalho para o título e o botão, resolvendo a sobreposição */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Adicionar Transação</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <TransactionForm onSave={onClose} />
      </div>
    </div>
  );
}