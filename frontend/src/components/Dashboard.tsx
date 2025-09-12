import React, { useState, useEffect, useMemo } from 'react';
import { TransactionModal } from './TransactionModal';
import { getTransactions } from '../services/api'; // Importe a função da API
import { Transaction } from '../types'; // Importe o tipo
import toast from 'react-hot-toast';
import { LoaderCircle } from 'lucide-react';

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para os dados reais
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar os dados
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Falha ao buscar transações:", error);
      toast.error("Não foi possível carregar os dados do dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect para buscar os dados quando o componente é montado
  useEffect(() => {
    fetchTransactions();
  }, []);

  // useMemo para calcular as métricas de forma eficiente
  const metrics = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const transactionsThisMonth = transactions.filter(t => {
      const transactionDate = new Date(t.purchaseDate);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    const income = transactionsThisMonth
      .filter(t => t.transactionType.toLowerCase() === 'income')
      .reduce((acc, t) => acc + t.totalAmount, 0);

    const expenses = transactionsThisMonth
      .filter(t => t.transactionType.toLowerCase() === 'expense')
      .reduce((acc, t) => acc + t.totalAmount, 0);
      
    // O saldo total considera todas as transações, não apenas as do mês
    const balance = transactions.reduce((acc, t) => acc + t.totalAmount, 0);

    return { balance, income, expenses };
  }, [transactions]);

  // Pega as 4 transações mais recentes para exibir na lista
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      .slice(0, 4);
  }, [transactions]);

  // Função para ser chamada quando uma nova transação é salva
  const handleTransactionSaved = () => {
    setIsModalOpen(false);
    // Busca os dados novamente para atualizar a UI
    fetchTransactions(); 
  };

  return (
    <>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LoaderCircle className="animate-spin text-green-500" size={40} />
          </div>
        ) : (
          <>
            {/* Seção de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-sm">Saldo Atual</h3>
                <p className="text-3xl font-bold text-white mt-2">R$ {metrics.balance.toFixed(2)}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-sm">Receitas do Mês</h3>
                <p className="text-3xl font-bold text-green-400 mt-2">R$ {metrics.income.toFixed(2)}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-sm">Despesas do Mês</h3>
                <p className="text-3xl font-bold text-red-400 mt-2">R$ {Math.abs(metrics.expenses).toFixed(2)}</p>
              </div>
            </div>

            {/* Seção de Ações Rápidas e Transações Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Transações Recentes</h3>
                <div className="space-y-4">
                  {recentTransactions.length > 0 ? recentTransactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{t.description}</p>
                        <p className="text-sm text-slate-400">{new Date(t.purchaseDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                      </div>
                      <p className={`font-bold ${t.transactionType.toLowerCase() === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.transactionType.toLowerCase() === 'income' ? '+' : '-'} R$ {Math.abs(t.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  )) : (
                    <p className="text-slate-400">Nenhuma transação recente.</p>
                  )}
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col justify-center items-center">
                  <h3 className="text-xl font-bold mb-4">Ações Rápidas</h3>
                  <button 
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300"
                  >
                      + Adicionar Transação
                  </button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Passamos a nova função para o modal */}
      <TransactionModal isOpen={isModalOpen} onClose={handleTransactionSaved} />
    </>
  );
}