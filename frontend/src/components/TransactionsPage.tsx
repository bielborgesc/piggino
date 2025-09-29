import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlusCircle, Search, ChevronLeft, ChevronRight, LoaderCircle, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { TransactionModal } from './TransactionModal';
// ✅ 1. Importar funções e tipos necessários
import { getTransactions, deleteTransaction, toggleInstallmentPaidStatus, toggleTransactionPaidStatus, getCategories, getFinancialSources } from '../services/api';
import { Transaction, Category, FinancialSource } from '../types';
import toast from 'react-hot-toast';

function MonthNavigator({ currentDate, onPreviousMonth, onNextMonth }: { currentDate: Date; onPreviousMonth: () => void; onNextMonth: () => void; }) {
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
    const year = currentDate.getFullYear();
    return (
        <div className="flex items-center justify-center gap-2 sm:gap-4 bg-slate-700/50 p-2 rounded-lg">
            <button onClick={onPreviousMonth} className="p-2 rounded-md hover:bg-slate-600 transition-colors"><ChevronLeft size={20} /></button>
            <span className="text-base sm:text-lg font-semibold w-32 sm:w-40 text-center capitalize">{monthName} de {year}</span>
            <button onClick={onNextMonth} className="p-2 rounded-md hover:bg-slate-600 transition-colors"><ChevronRight size={20} /></button>
        </div>
    );
}

export function TransactionsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // ✅ 2. Estados para os novos filtros e para guardar as opções
    const [categories, setCategories] = useState<Category[]>([]);
    const [financialSources, setFinancialSources] = useState<FinancialSource[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedSource, setSelectedSource] = useState<string>('');

    const fetchPageData = useCallback(async () => {
        try {
            // Carrega todos os dados necessários em paralelo para melhor performance
            const [transactionsData, categoriesData, sourcesData] = await Promise.all([
                getTransactions(),
                getCategories(),
                getFinancialSources()
            ]);
            
            setAllTransactions(transactionsData);
            setCategories(categoriesData);
            setFinancialSources(sourcesData);

        } catch (error) {
            toast.error("Não foi possível carregar os dados da página.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchPageData();
    }, [fetchPageData]);

    const handlePreviousMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    const monthlyItems = useMemo(() => {
        let items: any[] = [];
        
        // Esta lógica de processamento de transações, parcelas e fixas permanece a mesma
        for (const t of allTransactions) {
            if (!t.isInstallment && !t.isFixed) {
                const transactionDate = new Date(t.purchaseDate);
                if (transactionDate.getFullYear() === currentDate.getFullYear() && transactionDate.getMonth() === currentDate.getMonth()) {
                    items.push({ ...t, displayAmount: t.totalAmount, isInstallmentItem: false });
                }
            } else if (t.isInstallment && t.cardInstallments) {
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
            } else if (t.isFixed) {
                const transactionDate = new Date(t.purchaseDate);
                 if (transactionDate.getFullYear() === currentDate.getFullYear() && transactionDate.getMonth() === currentDate.getMonth()) {
                    items.push({ ...t, displayAmount: t.totalAmount, isInstallmentItem: false });
                }
            }
        }
        
        // ✅ 3. Lógica de filtragem atualizada para incluir os novos filtros
        let filteredItems = items;

        if (filterType !== 'all') {
            filteredItems = filteredItems.filter(item => item.transactionType.toLowerCase() === filterType);
        }
        
        if (selectedCategory) {
            filteredItems = filteredItems.filter(item => String(item.categoryId) === selectedCategory);
        }

        if (selectedSource) {
            filteredItems = filteredItems.filter(item => String(item.financialSourceId) === selectedSource);
        }

        if (searchQuery) {
            filteredItems = filteredItems.filter(item => 
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filteredItems;
    }, [currentDate, filterType, allTransactions, searchQuery, selectedCategory, selectedSource]);

    const summary = useMemo(() => {
        const expenses = monthlyItems.filter(item => item.transactionType === 'Expense');
        const paidAmount = expenses.filter(item => item.isPaid).reduce((acc, item) => acc + item.displayAmount, 0);
        const pendingAmount = expenses.filter(item => !item.isPaid).reduce((acc, item) => acc + item.displayAmount, 0);
        const totalAmount = paidAmount + pendingAmount;
        return { totalAmount, paidAmount, pendingAmount };
    }, [monthlyItems]);

    const handleTogglePaid = async (item: any) => {
        const toastId = toast.loading("Atualizando status...");
        try {
            if (item.isInstallmentItem) {
                await toggleInstallmentPaidStatus(item.installmentId);
            } else if (item.isFixed) {
                toast.error("Status de transações fixas será uma funcionalidade futura!");
                toast.dismiss(toastId);
                return;
            }
             else {
                await toggleTransactionPaidStatus(item.id);
            }
            toast.success("Status atualizado!", { id: toastId });
            // Apenas recarrega os dados para refletir a mudança
            const data = await getTransactions();
            setAllTransactions(data);
        } catch (error) {
            toast.error("Não foi possível atualizar o status.", { id: toastId });
        }
    };
    
    const handleOpenModal = (item: any | null) => {
        if (item && item.isInstallmentItem) {
            const originalTransaction = allTransactions.find(t => t.id === item.id);
            setEditingTransaction(originalTransaction || null);
        } else {
            setEditingTransaction(item);
        }
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
        fetchPageData();
    };

    const handleDelete = async (item: any) => {
        const transactionIdToDelete = item.isInstallmentItem ? item.id : item.id;
        if (window.confirm('Tem certeza? A transação e todas as suas parcelas (se houver) serão excluídas.')) {
            const toastId = toast.loading('Excluindo...');
            try {
                await deleteTransaction(transactionIdToDelete);
                toast.success('Transação excluída!', { id: toastId });
                fetchPageData();
            } catch (error) {
                toast.error('Falha ao excluir a transação.', { id: toastId });
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
                    <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg">
                        <PlusCircle size={20} />
                        Adicionar Transação
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-slate-400 text-sm">Total de Despesas do Mês</h4>
                        <p className="text-2xl font-bold text-white mt-1">R$ {summary.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-slate-400 text-sm">Pago</h4>
                        <p className="text-2xl font-bold text-green-400 mt-1">R$ {summary.paidAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-slate-400 text-sm">Pendente</h4>
                        <p className="text-2xl font-bold text-red-400 mt-1">R$ {summary.pendingAmount.toFixed(2)}</p>
                    </div>
                </div>

                {/* ✅ 4. BARRA DE FILTROS ATUALIZADA */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-col lg:flex-row gap-4 items-center flex-wrap">
                    <MonthNavigator currentDate={currentDate} onPreviousMonth={handlePreviousMonth} onNextMonth={handleNextMonth} />
                    
                    <div className="relative flex-grow w-full lg:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Pesquisar..." 
                            className="w-full bg-slate-700 border-slate-600 rounded-md p-2 pl-10 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-green-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full lg:w-auto bg-slate-700 border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">Todas as Categorias</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>

                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="w-full lg:w-auto bg-slate-700 border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">Todas as Origens</option>
                        {financialSources.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
                    </select>
                    
                    <div className="flex gap-2 w-full lg:w-auto">
                        <button onClick={() => setFilterType('all')} className={`flex-1 lg:flex-none ${filterType === 'all' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg`}>Tudo</button>
                        <button onClick={() => setFilterType('income')} className={`flex-1 lg:flex-none ${filterType === 'income' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg`}>Receitas</button>
                        <button onClick={() => setFilterType('expense')} className={`flex-1 lg:flex-none ${filterType === 'expense' ? 'bg-slate-600' : 'bg-slate-900'} hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg`}>Despesas</button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center p-10"><LoaderCircle className="animate-spin text-green-500" size={40} /></div>
                ) : (
                    <>
                        {/* LISTA DE CARDS PARA MOBILE */}
                        <div className="space-y-4 md:hidden">
                            {monthlyItems.length > 0 ? (
                                monthlyItems.map((item) => (
                                    <div key={item.syntheticId || item.id} className={`p-4 rounded-lg border transition-colors flex gap-4 ${item.isPaid ? 'bg-green-900/20 border-green-800/20 text-slate-500' : 'bg-slate-800 border-slate-700'}`}>
                                        <div className="flex flex-col items-center justify-center">
                                            <button onClick={() => handleTogglePaid(item)} title={item.isPaid ? "Marcar como pendente" : "Marcar como pago"}>
                                                {item.isPaid ? <CheckCircle className="text-green-400" /> : <XCircle className="text-slate-500 hover:text-slate-300" />}
                                            </button>
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-semibold ${item.isPaid ? 'line-through text-slate-400' : 'text-white'}`}>{item.description}</p>
                                            <p className={`text-sm ${item.isPaid ? 'line-through text-slate-500' : 'text-slate-400'}`}>{item.categoryName} • {item.financialSourceName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-lg ${item.isPaid ? 'opacity-50' : ''} ${item.transactionType.toLowerCase() === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                                {item.transactionType.toLowerCase() === 'income' ? '+' : '-'} R$ {Math.abs(item.displayAmount).toFixed(2)}
                                            </p>
                                            <div className="flex gap-2 justify-end mt-1">
                                                <button onClick={() => handleOpenModal(item)} className="text-slate-400 hover:text-white"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(item)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">Nenhuma transação encontrada.</div>
                            )}
                        </div>

                        {/* TABELA PARA DESKTOP */}
                        <div className="hidden md:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="p-4 font-semibold w-12 text-center">Status</th>
                                        <th className="p-4 font-semibold">Descrição</th>
                                        <th className="p-4 font-semibold">Valor</th>
                                        <th className="p-4 font-semibold">Categoria</th>
                                        <th className="p-4 font-semibold">Fonte</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyItems.length > 0 ? (
                                        monthlyItems.map((item) => (
                                            <tr key={item.syntheticId || item.id} className={`border-b border-slate-700 last:border-b-0 transition-colors ${item.isPaid ? 'bg-green-900/20 hover:bg-green-800/30 text-slate-500' : 'hover:bg-slate-700/30'}`}>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleTogglePaid(item)} title={item.isPaid ? "Marcar como pendente" : "Marcar como pago"}>
                                                        {item.isPaid ? <CheckCircle className="text-green-400" /> : <XCircle className="text-slate-500 hover:text-slate-300" />}
                                                    </button>
                                                </td>
                                                <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-100'}`}>{item.description}</td>
                                                <td className={`p-4 font-bold ${item.isPaid ? 'opacity-50' : ''} ${item.transactionType.toLowerCase() === 'income' ? 'text-green-400' : 'text-red-400'}`}>{item.transactionType.toLowerCase() === 'income' ? '+' : '-'} R$ {Math.abs(item.displayAmount).toFixed(2)}</td>
                                                <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-400'}`}>{item.categoryName}</td>
                                                <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-400'}`}>{item.financialSourceName}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleOpenModal(item)} className="text-slate-400 hover:text-white p-2" title="Editar Transação Original"><Edit size={18} /></button>
                                                    <button onClick={() => handleDelete(item)} className="text-slate-400 hover:text-red-400 p-2" title="Excluir Transação Original"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={6} className="text-center p-8 text-slate-400">Nenhuma transação encontrada para os filtros selecionados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
            <TransactionModal isOpen={isModalOpen} onClose={handleModalClose} transactionToEdit={editingTransaction} />
        </>
    );
}