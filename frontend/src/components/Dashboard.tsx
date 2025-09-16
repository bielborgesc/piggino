import React, { useState, useEffect, useMemo } from 'react';
import { TransactionModal } from './TransactionModal';
import { getTransactions } from '../services/api';
import { Transaction } from '../types';
import toast from 'react-hot-toast';
import { LoaderCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Componente para o navegador de meses
function MonthNavigator({ currentDate, onPreviousMonth, onNextMonth }: { currentDate: Date; onPreviousMonth: () => void; onNextMonth: () => void; }) {
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
    const year = currentDate.getFullYear();
    return (
        <div className="flex items-center justify-center gap-2 sm:gap-4 bg-slate-700/50 p-2 rounded-lg mb-6">
            <button onClick={onPreviousMonth} className="p-2 rounded-md hover:bg-slate-600 transition-colors"><ChevronLeft size={20} /></button>
            <span className="text-base sm:text-lg font-semibold w-32 sm:w-40 text-center capitalize">{monthName} de {year}</span>
            <button onClick={onNextMonth} className="p-2 rounded-md hover:bg-slate-600 transition-colors"><ChevronRight size={20} /></button>
        </div>
    );
}

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const handlePreviousMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // ✅ LÓGICA CORRIGIDA: Processa transações e parcelas para o mês selecionado
  const monthlyItems = useMemo(() => {
    const items: any[] = [];
    for (const t of transactions) {
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
                        syntheticId: `${t.id}-${installment.id}`,
                        description: `${t.description} (${installment.installmentNumber}/${t.installmentCount})`,
                        displayAmount: installment.amount,
                        isInstallmentItem: true,
                        isPaid: installment.isPaid,
                        installmentId: installment.id
                    });
                }
            }
        }
    }
    return items;
  }, [currentDate, transactions]);

  const metrics = useMemo(() => {
    const income = monthlyItems
      .filter(t => t.transactionType.toLowerCase() === 'income')
      .reduce((acc, t) => acc + t.displayAmount, 0);

    const expenses = monthlyItems
      .filter(t => t.transactionType.toLowerCase() === 'expense')
      .reduce((acc, t) => acc + t.displayAmount, 0);
      
    // O saldo total continua considerando todas as transações, independente do mês
    const balance = transactions.reduce((acc, t) => {
        return t.transactionType.toLowerCase() === 'income' ? acc + t.totalAmount : acc - t.totalAmount;
    }, 0);

    return { balance, income, expenses };
  }, [monthlyItems, transactions]);

  const recentTransactions = useMemo(() => {
    return [...monthlyItems]
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      .slice(0, 4);
  }, [monthlyItems]);

  const handleTransactionSaved = () => {
    setIsModalOpen(false);
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
            <MonthNavigator 
                currentDate={currentDate}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
            />
            {/* Seção de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-sm">Saldo Atual (Total)</h3>
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
                <h3 className="text-xl font-bold mb-4">Transações Recentes do Mês</h3>
                <div className="space-y-4">
                  {recentTransactions.length > 0 ? recentTransactions.map(t => (
                    <div key={t.syntheticId || t.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{t.description}</p>
                        <p className="text-sm text-slate-400">{new Date(t.purchaseDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                      </div>
                      <p className={`font-bold ${t.transactionType.toLowerCase() === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.transactionType.toLowerCase() === 'income' ? '+' : '-'} R$ {Math.abs(t.displayAmount).toFixed(2)}
                      </p>
                    </div>
                  )) : (
                    <p className="text-slate-400">Nenhuma transação para este mês.</p>
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
      <TransactionModal isOpen={isModalOpen} onClose={handleTransactionSaved} />
    </>
  );
}