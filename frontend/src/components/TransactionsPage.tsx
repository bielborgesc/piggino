import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlusCircle, Search, MoreVertical, ChevronLeft, ChevronRight, LoaderCircle, Edit, Trash2 } from 'lucide-react';
import { TransactionModal } from './TransactionModal';
import { getTransactions, deleteTransaction } from '../services/api';
import { Transaction, CardInstallment } from '../types'; // Importe CardInstallment
import toast from 'react-hot-toast';

function MonthNavigator({ currentDate, onPreviousMonth, onNextMonth }: { currentDate: Date; onPreviousMonth: () => void; onNextMonth: () => void; }) {
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
    const year = currentDate.getFullYear();

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-4 bg-slate-700/50 p-2 rounded-lg">
            <button onClick={onPreviousMonth} className="p-2 rounded-md hover:bg-slate-600 transition-colors">
                <ChevronLeft size={20} />
            </button>
            <span className="text-base sm:text-lg font-semibold w-32 sm:w-40 text-center capitalize">
                {monthName} de {year}
            </span>
            <button onClick={onNextMonth} className="p-2 rounded-md hover:bg-slate-600 transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

export function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTransactions();
      setAllTransactions(data);
    } catch (error) {
      console.error("Falha ao buscar transações:", error);
      toast.error("Não foi possível carregar as transações.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // ✅ NOVA LÓGICA PARA LIDAR COM PARCELAS
  const monthlyItems = useMemo(() => {
    const items = [];
    
    for (const t of allTransactions) {
      if (!t.isInstallment) {
        const transactionDate = new Date(t.purchaseDate);
        if (transactionDate.getFullYear() === currentDate.getFullYear() && transactionDate.getMonth() === currentDate.getMonth()) {
          items.push({ ...t, displayAmount: t.totalAmount, isInstallmentItem: false });
        }
      } else if (t.cardInstallments) {
        const purchaseDate = new Date(t.purchaseDate);
        for (const installment of t.cardInstallments) {
          const installmentMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + installment.installmentNumber - 1, 1);
          if (installmentMonth.getFullYear() === currentDate.getFullYear() && installmentMonth.getMonth() === currentDate.getMonth()) {
            items.push({
              ...t,
              id: `${t.id}-${installment.id}`,
              description: `${t.description} (${installment.installmentNumber}/${t.installmentCount})`,
              displayAmount: installment.amount,
              isInstallmentItem: true,
              isPaid: installment.isPaid
            });
          }
        }
      }
    }
    
    return items.filter(item => {
      if (filterType === 'all') return true;
      return item.transactionType.toLowerCase() === filterType;
    });

  }, [currentDate, filterType, allTransactions]);

  const handleOpenCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchTransactions();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
        const toastId = toast.loading('Excluindo transação...');
        try {
            await deleteTransaction(id); 
            toast.success('Transação excluída com sucesso!', { id: toastId });
            fetchTransactions();
        } catch (error) {
            console.error('Erro ao deletar transação', error);
            toast.error('Não foi possível excluir a transação.', { id: toastId });
        }
    }
  };

  return (
    <>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Minhas Transações</h2>
            <p className="text-slate-400">Veja e gerencie todos os seus lançamentos.</p>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
          >
            <PlusCircle size={20} />
            Adicionar Transação
          </button>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-col lg:flex-row gap-4 items-center">
             <MonthNavigator 
                 currentDate={currentDate}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
            />
            <div className="relative flex-1 w-full lg:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Pesquisar..." className="w-full bg-slate-700 border-slate-600 rounded-md p-2 pl-10 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition" />
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
                <button onClick={() => setFilterType('all')} className={`flex-1 lg:flex-none ${filterType === 'all' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors`}>Tudo</button>
                <button onClick={() => setFilterType('income')} className={`flex-1 lg:flex-none ${filterType === 'income' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors`}>Receitas</button>
                <button onClick={() => setFilterType('expense')} className={`flex-1 lg:flex-none ${filterType === 'expense' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors`}>Despesas</button>
            </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <LoaderCircle className="animate-spin text-green-500" size={40} />
          </div>
        ) : (
          <div className="hidden md:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="p-4 font-semibold">Descrição</th>
                  <th className="p-4 font-semibold">Valor</th>
                  <th className="p-4 font-semibold">Categoria</th>
                  <th className="p-4 font-semibold">Data da Compra</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {monthlyItems.length > 0 ? (
                  monthlyItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/30">
                      <td className="p-4">{item.description}</td>
                      <td className={`p-4 font-bold ${item.transactionType.toLowerCase() === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {item.transactionType.toLowerCase() === 'income' ? '+' : '-'} R$ {Math.abs(item.displayAmount).toFixed(2)}
                      </td>
                      <td className="p-4 text-slate-400">Categoria ID: {item.categoryId}</td>
                      <td className="p-4 text-slate-400">{new Date(item.purchaseDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => !item.isInstallmentItem && handleOpenEditModal(item as Transaction)} 
                          disabled={item.isInstallmentItem} 
                          className="text-slate-400 hover:text-white p-2 disabled:text-slate-600 disabled:cursor-not-allowed" 
                          title={item.isInstallmentItem ? "Não é possível editar uma parcela individual" : "Editar Transação"}
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id as number)} 
                          disabled={item.isInstallmentItem}
                          className="text-slate-400 hover:text-red-400 p-2 disabled:text-slate-600 disabled:cursor-not-allowed" 
                          title={item.isInstallmentItem ? "Não é possível excluir uma parcela individual" : "Excluir Transação"}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-400">Nenhuma transação encontrada para este mês.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose}
        transactionToEdit={editingTransaction} 
      />
    </>
  );
}