import React from 'react';
import { X } from 'lucide-react';
import { TransactionForm } from './TransactionForm'; // Reutilizamos o formulário!

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  // Se não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  return (
    // Fundo semi-transparente (backdrop)
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      onClick={onClose} // Fecha o modal ao clicar no fundo
    >
      {/* Contentor do Modal */}
      <div 
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 p-8 relative"
        onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do modal o feche
      >
        {/* Botão de Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Conteúdo do Modal */}
        <TransactionForm onSave={onClose} />
      </div>
    </div>
  );
}
