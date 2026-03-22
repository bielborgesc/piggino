import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlusCircle, Search, ChevronLeft, ChevronRight, LoaderCircle, Edit, Trash2, CheckCircle, XCircle, RefreshCw, CreditCard } from 'lucide-react';
import { TransactionModal } from './TransactionModal';
import { InstallmentBreakdown } from './InstallmentBreakdown';
import { RecurrenceScopeModal } from './RecurrenceScopeModal';
import { getTransactions, deleteTransaction, deleteInstallmentsByScope, getCategories, getFinancialSources, toggleInstallmentPaidStatus, toggleTransactionPaidStatus } from '../services/api';
import { Transaction, Category, FinancialSource, RecurrenceScope } from '../types';
import toast from 'react-hot-toast';

const DEFAULT_CATEGORY_COLOR = '#6b7280';

function CategoryBadge({ name, color, faded }: { name?: string | null; color?: string; faded?: boolean }) {
    if (!name) return <span>-</span>;
    return (
        <span className={`inline-flex items-center gap-1.5 ${faded ? 'opacity-50' : ''}`}>
            <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color ?? DEFAULT_CATEGORY_COLOR }}
            />
            {name}
        </span>
    );
}

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
    const [expandedInstallmentRowId, setExpandedInstallmentRowId] = useState<string | null>(null);

    const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
    const [scopeModalAction, setScopeModalAction] = useState<'edit' | 'delete'>('edit');
    const [pendingScopeItem, setPendingScopeItem] = useState<Transaction | null>(null);
    const [pendingEditScope, setPendingEditScope] = useState<RecurrenceScope | undefined>(undefined);

    const [isInstallmentScopeModalOpen, setIsInstallmentScopeModalOpen] = useState(false);
    const [installmentScopeModalAction, setInstallmentScopeModalAction] = useState<'edit' | 'delete'>('edit');
    const [pendingInstallmentItem, setPendingInstallmentItem] = useState<Transaction | null>(null);
    const [pendingInstallmentEditScope, setPendingInstallmentEditScope] = useState<RecurrenceScope | undefined>(undefined);
    const [pendingInstallmentNumber, setPendingInstallmentNumber] = useState<number | undefined>(undefined);

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
        // 1. Filtragem por Mês e Ano (Usando UTC para evitar bugs de fuso horário)
        const items = allTransactions.filter(t => {
            const date = new Date(t.purchaseDate); // Esta já é a data de exibição/vencimento vinda do backend
            const viewYear = currentDate.getFullYear();
            const viewMonth = currentDate.getMonth();

            return date.getUTCFullYear() === viewYear && date.getUTCMonth() === viewMonth;
        }).map(t => ({
            ...t,
            // displayAmount agora é o totalAmount que o backend já enviou (já é o valor da parcela)
            displayAmount: t.totalAmount,
            // Identificador único para o React
            syntheticId: `${t.id}-${t.purchaseDate}`
        }));

        // 2. Aplicação dos filtros de busca e categoria
        let filteredItems = items;

        if (filterType !== 'all') {
            filteredItems = filteredItems.filter(item => item.transactionType.toLowerCase() === filterType.toLowerCase());
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
    
    const resolveOriginalTransaction = (item: Transaction): Transaction => {
        const original = allTransactions.find(t => t.id === item.id);
        return original ?? item;
    };

    const handleOpenModal = (item: Transaction | null) => {
        if (item === null) {
            setEditingTransaction(null);
            setIsModalOpen(true);
            return;
        }

        if (item.isInstallment && item.currentInstallmentNumber !== undefined) {
            setPendingInstallmentItem(item);
            setInstallmentScopeModalAction('edit');
            setIsInstallmentScopeModalOpen(true);
            return;
        }

        const original = resolveOriginalTransaction(item);

        if (original.isRecurring) {
            setPendingScopeItem(original);
            setScopeModalAction('edit');
            setIsScopeModalOpen(true);
            return;
        }

        setEditingTransaction(original);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
        setPendingEditScope(undefined);
        setPendingInstallmentEditScope(undefined);
        setPendingInstallmentNumber(undefined);
        fetchPageData();
    };

    const handleDelete = (item: Transaction) => {
        if (item.isInstallment && item.currentInstallmentNumber !== undefined) {
            setPendingInstallmentItem(item);
            setInstallmentScopeModalAction('delete');
            setIsInstallmentScopeModalOpen(true);
            return;
        }

        const original = resolveOriginalTransaction(item);

        if (original.isRecurring) {
            setPendingScopeItem(original);
            setScopeModalAction('delete');
            setIsScopeModalOpen(true);
            return;
        }

        executeDelete(original.id, 'OnlyThis');
    };

    const executeDelete = async (id: number, scope: RecurrenceScope) => {
        const toastId = toast.loading('Excluindo...');
        try {
            await deleteTransaction(id, scope);
            toast.success('Transação excluída!', { id: toastId });
            fetchPageData();
        } catch (error) {
            toast.error('Falha ao excluir a transação.', { id: toastId });
        }
    };

    const handleScopeConfirm = (scope: RecurrenceScope) => {
        setIsScopeModalOpen(false);

        if (pendingScopeItem === null) return;

        if (scopeModalAction === 'delete') {
            executeDelete(pendingScopeItem.id, scope);
        } else {
            setPendingEditScope(scope);
            setEditingTransaction(pendingScopeItem);
            setIsModalOpen(true);
        }

        setPendingScopeItem(null);
    };

    const handleScopeCancel = () => {
        setIsScopeModalOpen(false);
        setPendingScopeItem(null);
    };

    const executeInstallmentDelete = async (transactionId: number, installmentNumber: number, scope: RecurrenceScope) => {
        const toastId = toast.loading('Excluindo parcelas...');
        try {
            await deleteInstallmentsByScope(transactionId, installmentNumber, scope);
            toast.success('Parcelas excluídas!', { id: toastId });
            fetchPageData();
        } catch (error) {
            toast.error('Falha ao excluir as parcelas.', { id: toastId });
        }
    };

    const handleInstallmentScopeConfirm = (scope: RecurrenceScope) => {
        setIsInstallmentScopeModalOpen(false);

        if (pendingInstallmentItem === null || pendingInstallmentItem.currentInstallmentNumber === undefined) return;

        const installmentNumber = pendingInstallmentItem.currentInstallmentNumber;

        if (installmentScopeModalAction === 'delete') {
            executeInstallmentDelete(pendingInstallmentItem.id, installmentNumber, scope);
        } else {
            const originalForEdit = resolveOriginalTransaction(pendingInstallmentItem);
            setPendingInstallmentEditScope(scope);
            setPendingInstallmentNumber(installmentNumber);
            setEditingTransaction(originalForEdit);
            setIsModalOpen(true);
        }

        setPendingInstallmentItem(null);
    };

    const handleInstallmentScopeCancel = () => {
        setIsInstallmentScopeModalOpen(false);
        setPendingInstallmentItem(null);
    };

    const handleToggleInstallmentBreakdown = (rowId: string) => {
        setExpandedInstallmentRowId(prev => (prev === rowId ? null : rowId));
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
                                monthlyItems.map((item) => {
                                    const rowId = item.syntheticId ?? String(item.id);
                                    const hasInstallments = item.cardInstallments && item.cardInstallments.length > 0;
                                    const isExpanded = expandedInstallmentRowId === rowId;
                                    return (
                                        <div key={rowId} className={`p-4 rounded-lg border transition-colors ${item.isPaid ? 'bg-green-900/20 border-green-800/20 text-slate-500' : 'bg-slate-800 border-slate-700'}`}>
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center justify-center">
                                                    <button onClick={() => handleTogglePaid(item)} title={item.isPaid ? "Marcar como pendente" : "Marcar como pago"}>
                                                        {item.isPaid ? <CheckCircle className="text-green-400" /> : <XCircle className="text-slate-500 hover:text-slate-300" />}
                                                    </button>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`font-semibold ${item.isPaid ? 'line-through text-slate-400' : 'text-white'}`}>{item.description}</p>
                                                        {item.isRecurring && (
                                                            <span title="Recorrente" className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded">
                                                                <RefreshCw size={10} />
                                                                Recorrente
                                                            </span>
                                                        )}
                                                        {hasInstallments && (
                                                            <button
                                                                onClick={() => handleToggleInstallmentBreakdown(rowId)}
                                                                title="Ver parcelas"
                                                                className="flex items-center gap-1 text-xs text-purple-300 bg-purple-900/40 hover:bg-purple-800/60 px-1.5 py-0.5 rounded transition-colors"
                                                            >
                                                                <CreditCard size={10} />
                                                                {item.cardInstallments!.length}x
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className={`text-sm flex items-center gap-1 flex-wrap ${item.isPaid ? 'line-through text-slate-500' : 'text-slate-400'}`}>
                                                        <CategoryBadge
                                                            name={item.categoryName}
                                                            color={categories.find(c => c.id === item.categoryId)?.color}
                                                            faded={item.isPaid}
                                                        />
                                                        <span>•</span>
                                                        <span>{item.financialSourceName}</span>
                                                    </div>
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
                                            {isExpanded && hasInstallments && (
                                                <InstallmentBreakdown installments={item.cardInstallments!} />
                                            )}
                                        </div>
                                    );
                                })
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
                                        monthlyItems.map((item) => {
                                            const rowId = item.syntheticId ?? String(item.id);
                                            const hasInstallments = item.cardInstallments && item.cardInstallments.length > 0;
                                            const isExpanded = expandedInstallmentRowId === rowId;
                                            return (
                                                <React.Fragment key={rowId}>
                                                    <tr className={`border-b border-slate-700 transition-colors ${!isExpanded ? 'last:border-b-0' : ''} ${item.isPaid ? 'bg-green-900/20 hover:bg-green-800/30 text-slate-500' : 'hover:bg-slate-700/30'}`}>
                                                        <td className="p-4 text-center">
                                                            <button onClick={() => handleTogglePaid(item)} title={item.isPaid ? "Marcar como pendente" : "Marcar como pago"}>
                                                                {item.isPaid ? <CheckCircle className="text-green-400" /> : <XCircle className="text-slate-500 hover:text-slate-300" />}
                                                            </button>
                                                        </td>
                                                        <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-100'}`}>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span>{item.description}</span>
                                                                {item.isRecurring && (
                                                                    <span title="Recorrente" className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                        <RefreshCw size={10} />
                                                                        Recorrente
                                                                    </span>
                                                                )}
                                                                {hasInstallments && (
                                                                    <button
                                                                        onClick={() => handleToggleInstallmentBreakdown(rowId)}
                                                                        title="Ver parcelas"
                                                                        className="flex items-center gap-1 text-xs text-purple-300 bg-purple-900/40 hover:bg-purple-800/60 px-1.5 py-0.5 rounded whitespace-nowrap transition-colors"
                                                                    >
                                                                        <CreditCard size={10} />
                                                                        {item.cardInstallments!.length}x
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={`p-4 font-bold ${item.isPaid ? 'opacity-50' : ''} ${item.transactionType.toLowerCase() === 'income' ? 'text-green-400' : 'text-red-400'}`}>{item.transactionType.toLowerCase() === 'income' ? '+' : '-'} R$ {Math.abs(item.displayAmount).toFixed(2)}</td>
                                                        <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-400'}`}>
                                                            <CategoryBadge
                                                                name={item.categoryName}
                                                                color={categories.find(c => c.id === item.categoryId)?.color}
                                                                faded={item.isPaid}
                                                            />
                                                        </td>
                                                        <td className={`p-4 ${item.isPaid ? 'line-through' : 'text-slate-400'}`}>{item.financialSourceName}</td>
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => handleOpenModal(item)} className="text-slate-400 hover:text-white p-2" title="Editar Transação Original"><Edit size={18} /></button>
                                                            <button onClick={() => handleDelete(item)} className="text-slate-400 hover:text-red-400 p-2" title="Excluir Transação Original"><Trash2 size={18} /></button>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && hasInstallments && (
                                                        <tr className="border-b border-slate-700">
                                                            <td colSpan={6} className="px-4 pb-4">
                                                                <InstallmentBreakdown installments={item.cardInstallments!} />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan={6} className="text-center p-8 text-slate-400">Nenhuma transação encontrada para os filtros selecionados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
            <TransactionModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                transactionToEdit={editingTransaction}
                recurrenceScope={pendingEditScope}
                installmentScope={pendingInstallmentEditScope}
                installmentNumber={pendingInstallmentNumber}
            />
            <RecurrenceScopeModal
                isOpen={isScopeModalOpen}
                action={scopeModalAction}
                onConfirm={handleScopeConfirm}
                onCancel={handleScopeCancel}
            />
            <RecurrenceScopeModal
                isOpen={isInstallmentScopeModalOpen}
                action={installmentScopeModalAction}
                variant="installment"
                onConfirm={handleInstallmentScopeConfirm}
                onCancel={handleInstallmentScopeCancel}
            />
        </>
    );
}