import React, { useState } from 'react'; // 1. Importe o useState
import { LayoutDashboard, ArrowRightLeft, Settings, LogOut } from 'lucide-react';
import { TransactionModal } from './TransactionModal'; // 2. Importe o novo modal

export function Dashboard() {
  // 3. Crie o estado para controlar a visibilidade do modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mockTransactions = [
    { id: 1, description: 'Salário Mensal', amount: 5000.00, type: 'income', date: '01/08/2025' },
    { id: 2, description: 'Aluguel', amount: -1500.00, type: 'expense', date: '05/08/2025' },
    { id: 3, description: 'Supermercado', amount: -450.75, type: 'expense', date: '10/08/2025' },
    { id: 4, description: 'Venda de item usado', amount: 200.00, type: 'income', date: '12/08/2025' },
  ];

  const balance = 3249.25;
  const income = 5200.00;
  const expenses = 1950.75;

  return (
    <>
      <div className="flex h-screen w-full bg-slate-900 text-white">
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {/* ... (Seção de Métricas e Transações Recentes permanecem as mesmas) ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-sm">Saldo Atual</h3>
                <p className="text-3xl font-bold text-white mt-2">R$ {balance.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-sm">Receitas do Mês</h3>
                <p className="text-3xl font-bold text-green-400 mt-2">R$ {income.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-sm">Despesas do Mês</h3>
                <p className="text-3xl font-bold text-red-400 mt-2">R$ {expenses.toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold mb-4">Transações Recentes</h3>
                    <div className="space-y-4">
                        {mockTransactions.map(t => (
                        <div key={t.id} className="flex justify-between items-center">
                            <div>
                            <p className="font-semibold">{t.description}</p>
                            <p className="text-sm text-slate-400">{t.date}</p>
                            </div>
                            <p className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                            {t.type === 'income' ? '+' : '-'} R$ {Math.abs(t.amount).toFixed(2)}
                            </p>
                        </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col justify-center items-center">
                    <h3 className="text-xl font-bold mb-4">Ações Rápidas</h3>
                    {/* 4. Adicione o onClick para abrir o modal */}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300"
                    >
                        + Adicionar Transação
                    </button>
                </div>
            </div>
          </div>
        </main>
      </div>

      {/* 5. Renderize o modal condicionalmente */}
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}