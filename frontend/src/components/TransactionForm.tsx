import React, { useState, useEffect } from 'react';
// import { getCategories, getFinancialSources, createTransaction } from '../services/api'; // Descomente quando a API estiver pronta
import { mockCategories } from '../data/categories'; // Usando mock por enquanto
import { mockFinancialSources } from '../data/financialSources'; // Usando mock por enquanto
import { Category, FinancialSource, CategoryType, TransactionData } from '../types';

// 1. Adicione a prop onSave
interface TransactionFormProps {
  onSave: () => void;
}

export function TransactionForm({ onSave }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [financialSources, setFinancialSources] = useState<FinancialSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transactionType, setTransactionType] = useState<CategoryType>('Expense');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [sourceId, setSourceId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isInstallment, setIsInstallment] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      // Simulação de chamada de API
      const [cats, sources] = await Promise.all([
          Promise.resolve(mockCategories),
          Promise.resolve(mockFinancialSources)
      ]);
      setCategories(cats);
      setFinancialSources(sources);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!description || !amount || !sourceId || !categoryId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    // Lógica de envio (simulada)
    console.log('Salvando transação...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert('Transação salva com sucesso!');
    
    // 2. Chame a função onSave para fechar o modal
    onSave();
  };

  // 3. Removemos o fundo e a borda, pois o modal já os tem.
  return (
    <div>
      <div className="flex bg-gray-700 rounded-md p-1 mb-6">
        <button
          onClick={() => setTransactionType('Expense')}
          className={`w-1/2 p-2 rounded-md font-bold transition-colors ${transactionType === 'Expense' ? 'bg-red-500' : 'hover:bg-gray-600'}`}
        >
          Despesa
        </button>
        <button
          onClick={() => setTransactionType('Income')}
          className={`w-1/2 p-2 rounded-md font-bold transition-colors ${transactionType === 'Income' ? 'bg-green-500' : 'hover:bg-gray-600'}`}
        >
          Receita
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (o resto do formulário permanece o mesmo) ... */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
            Descrição
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ex: Café com amigos"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
            Valor
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
            placeholder="0,00"
            step="0.01"
          />
        </div>

        <div>
          <label htmlFor="financialSource" className="block text-sm font-medium text-gray-400 mb-1">
            Origem Financeira
          </label>
          <select 
            id="financialSource" 
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'A carregar...' : 'Selecione uma origem'}</option>
            {financialSources.map(source => (
              <option key={source.id} value={source.id}>{source.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">
            Categoria
          </label>
          <select 
            id="category" 
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'A carregar...' : 'Selecione uma categoria'}</option>
            {filteredCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
            <input 
                type="checkbox"
                id="installment"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="installment" className="text-sm text-gray-300">
                É parcelado?
            </label>
        </div>
        
        <button 
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
            Salvar Transação
        </button>
      </form>
    </div>
  );
}