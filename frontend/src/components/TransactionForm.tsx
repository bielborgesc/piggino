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
    }
  }, [initialData]);

  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isInstallment && (!installmentCount || parseInt(installmentCount) < 2)) {
      toast.error('Para transações parceladas, informe pelo menos 2 parcelas.');
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
          {/* ✅ Bloco do campo "Valor" ATUALIZADO */}
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
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 pl-10" // Padding à esquerda para o R$
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="installment" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"/>
            <label htmlFor="installment" className="text-sm text-gray-300">É parcelado?</label>
          </div>
          {isInstallment && (
            <div className="flex-1">
              <input type="number" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} placeholder="Nº de parcelas" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-sm" min="2"/>
            </div>
          )}
        </div>
        <button type="submit" disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500">
          {isSaving ? 'Salvando...' : 'Salvar Transação'}
        </button>
      </form>
    </div>
  );
}