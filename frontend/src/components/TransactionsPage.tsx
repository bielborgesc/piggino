import React, { useState, useMemo } from 'react';
import { PlusCircle, Search, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { TransactionModal } from './TransactionModal';

// Usaremos dados mockados mais extensos para esta tela
const mockAllTransactions = [
    { id: 1, description: 'Salário Mensal', amount: 5000.00, type: 'income', category: 'Salário', date: '2025-08-01' },
    { id: 2, description: 'Aluguel', amount: -1500.00, type: 'expense', category: 'Moradia', date: '2025-08-05' },
    { id: 3, description: 'Supermercado', amount: -450.75, type: 'expense', category: 'Alimentação', date: '2025-08-10' },
    { id: 4, description: 'Venda de item usado', amount: 200.00, type: 'income', category: 'Renda Extra', date: '2025-08-12' },
    { id: 5, description: 'Conta de Luz', amount: -120.50, type: 'expense', category: 'Moradia', date: '2025-08-15' },
    { id: 6, description: 'Jantar com amigos', amount: -85.00, type: 'expense', category: 'Lazer', date: '2025-08-18' },
    { id: 7, description: 'Reembolso Imposto', amount: 350.00, type: 'income', category: 'Outros', date: '2025-07-20' },
    { id: 8, description: 'Gasolina', amount: -150.00, type: 'expense', category: 'Transporte', date: '2025-07-22' },
];

// Componente para a navegação de mês
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
  const [currentDate, setCurrentDate] = useState(new Date('2025-08-01T12:00:00Z'));
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const filteredTransactions = useMemo(() => {
    return mockAllTransactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentDate.getFullYear() &&
               transactionDate.getMonth() === currentDate.getMonth();
      })
      .filter(t => {
        if (filterType === 'all') return true;
        return t.type === filterType;
      });
  }, [currentDate, filterType]);

  return (
    <>
      {/* 1. Ajuste no padding para telas menores */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* Cabeçalho e Ações */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Minhas Transações</h2>
            <p className="text-slate-400">Veja e gira todos os seus lançamentos.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 self-start md:self-auto"
          >
            <PlusCircle size={20} />
            Adicionar Transação
          </button>
        </div>

        {/* Filtros e Pesquisa */}
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

        {/* 2. Lista de transações agora é responsiva */}
        <div className="space-y-4 md:hidden">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => (
              <div key={t.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold text-white">{t.description}</p>
                  <p className="text-sm text-slate-400">{t.category}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.amount < 0 ? `- R$ ${Math.abs(t.amount).toFixed(2)}` : `+ R$ ${t.amount.toFixed(2)}`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">
              Nenhuma transação encontrada para este mês.
            </div>
          )}
        </div>

        {/* Tabela de Transações (visível apenas em telas médias e maiores) */}
        <div className="hidden md:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="p-4 font-semibold">Descrição</th>
                <th className="p-4 font-semibold">Valor</th>
                <th className="p-4 font-semibold">Categoria</th>
                <th className="p-4 font-semibold">Data</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/30">
                    <td className="p-4">{t.description}</td>
                    <td className={`p-4 font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {t.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-slate-400">{t.category}</td>
                    <td className="p-4 text-slate-400">
                        {new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </td>
                    <td className="p-4 text-right">
                        <button className="text-slate-400 hover:text-white p-2">
                            <MoreVertical size={20} />
                        </button>
                    </td>
                    </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-400">
                        Nenhuma transação encontrada para este mês.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}