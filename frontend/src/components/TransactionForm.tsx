import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getCategories, getFinancialSources } from '../services/api';
import { Category, FinancialSource, CategoryType, TransactionData, Transaction } from '../types';

interface TransactionFormProps {
  onSave: (data: TransactionData, id?: number) => void;
  onCancel: () => void;
  initialData?: Transaction | null;
  isSaving: boolean;
}

export function TransactionForm({ onSave, onCancel, initialData, isSaving }: TransactionFormProps) {
  // Estados para os dados dos dropdowns
  const [categories, setCategories] = useState<Category[]>([]);
  const [financialSources, setFinancialSources] = useState<FinancialSource[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Estados dos campos do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionType, setTransactionType] = useState<CategoryType>('Expense');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState('');

  // ✅ NOVOS ESTADOS para a transação fixa
  const [isFixed, setIsFixed] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [cats, sources] = await Promise.all([getCategories(), getFinancialSources()]);
        setCategories(cats);
        setFinancialSources(sources);
      } catch (error) {
        toast.error("Não foi possível carregar os dados do formulário.");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(String(initialData.totalAmount));
      setPurchaseDate(new Date(initialData.purchaseDate).toISOString().split('T')[0]);
      setSourceId(String(initialData.financialSourceId));
      setCategoryId(String(initialData.categoryId));
      setTransactionType(initialData.transactionType);
      setIsInstallment(initialData.isInstallment);
      setInstallmentCount(initialData.installmentCount ? String(initialData.installmentCount) : '');
      // ✅ Popula os campos de transação fixa ao editar
      setIsFixed(initialData.isFixed);
      setDayOfMonth(initialData.dayOfMonth ? String(initialData.dayOfMonth) : '');
    } else {
      // Reseta para o estado de criação
      setDescription('');
      setAmount('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSourceId('');
      setCategoryId('');
      setTransactionType('Expense');
      setIsInstallment(false);
      setInstallmentCount('');
      // ✅ Reseta os campos de transação fixa ao criar
      setIsFixed(false);
      setDayOfMonth('');
    }
  }, [initialData]);

  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isInstallment && (!installmentCount || parseInt(installmentCount) < 2)) {
      toast.error('Para transações parceladas, informe pelo menos 2 parcelas.');
      return;
    }
    
    // ✅ Validação para transação fixa
    if (isFixed && (!dayOfMonth || parseInt(dayOfMonth) < 1 || parseInt(dayOfMonth) > 31)) {
        toast.error('Para transações fixas, informe um dia do mês válido (1 a 31).');
        return;
    }

    const transactionData: TransactionData = {
      description,
      totalAmount: parseFloat(amount),
      transactionType,
      financialSourceId: parseInt(sourceId),
      categoryId: parseInt(categoryId),
      isInstallment,
      installmentCount: isInstallment ? parseInt(installmentCount) : undefined,
      purchaseDate: new Date(purchaseDate).toISOString(),
      // ✅ Adiciona os novos dados ao objeto a ser salvo
      isFixed,
      dayOfMonth: isFixed ? parseInt(dayOfMonth) : undefined,
    };
    onSave(transactionData, initialData?.id);
  };

  return (
    <div>
      <div className="flex bg-gray-700 rounded-md p-1 mb-6">
        <button onClick={() => setTransactionType('Expense')} className={`w-1/2 p-2 rounded-md font-bold transition-colors ${transactionType === 'Expense' ? 'bg-red-500' : 'hover:bg-gray-600'}`}>Despesa</button>
        <button onClick={() => setTransactionType('Income')} className={`w-1/2 p-2 rounded-md font-bold transition-colors ${transactionType === 'Income' ? 'bg-green-500' : 'hover:bg-gray-600'}`}>Receita</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
          <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2" placeholder="Ex: Café com amigos"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">Valor</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                R$
              </span>
              <input 
                type="number" 
                id="amount" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 pl-10"
                placeholder="0,00" 
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-400 mb-1">Data</label>
            <input type="date" id="purchaseDate" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2"/>
          </div>
        </div>
        <div>
          <label htmlFor="financialSource" className="block text-sm font-medium text-gray-400 mb-1">Origem Financeira</label>
          <select id="financialSource" value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2" disabled={isLoadingData}>
            <option value="">{isLoadingData ? 'Carregando...' : 'Selecione uma origem'}</option>
            {financialSources.map(source => (<option key={source.id} value={source.id}>{source.name}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2" disabled={isLoadingData}>
            <option value="">{isLoadingData ? 'Carregando...' : 'Selecione uma categoria'}</option>
            {filteredCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
          </select>
        </div>
        
        {/* ✅ Bloco de seleção "Parcelado" ou "Fixo" */}
        <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="installment" 
                    checked={isInstallment} 
                    disabled={isFixed} // Desabilita se for fixo
                    onChange={(e) => setIsInstallment(e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                />
                <label htmlFor="installment" className={`text-sm ${isFixed ? 'text-gray-500' : 'text-gray-300'}`}>É parcelado?</label>
            </div>

            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="isFixed" 
                    checked={isFixed}
                    disabled={isInstallment} // Desabilita se for parcelado
                    onChange={(e) => setIsFixed(e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                />
                <label htmlFor="isFixed" className={`text-sm ${isInstallment ? 'text-gray-500' : 'text-gray-300'}`}>É fixo?</label>
            </div>
        </div>
        
        {/* ✅ Bloco que mostra o campo de input correto */}
        <div>
            {isInstallment && (
                <div className="mt-2">
                    <label htmlFor="installmentCount" className="block text-sm font-medium text-gray-400 mb-1">Nº de Parcelas</label>
                    <input type="number" id="installmentCount" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} placeholder="Ex: 12" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-sm" min="2"/>
                </div>
            )}
            {isFixed && (
                <div className="mt-2">
                    <label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-400 mb-1">Repetir todo dia</label>
                    <input type="number" id="dayOfMonth" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} placeholder="Ex: 5" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-sm" min="1" max="31"/>
                </div>
            )}
        </div>
        
        <div className="pt-4">
            <button type="submit" disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500">
                {isSaving ? 'Salvando...' : 'Salvar Transação'}
            </button>
        </div>
      </form>
    </div>
  );
}