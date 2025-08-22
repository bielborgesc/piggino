import React, { useState, useEffect } from 'react';
import { getCategories, getFinancialSources, createTransaction } from '../services/api';
import { Category, FinancialSource, CategoryType, TransactionData } from '../types';

export function TransactionForm() {
  // Estados para os dados da API
  const [categories, setCategories] = useState<Category[]>([]);
  const [financialSources, setFinancialSources] = useState<FinancialSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados para os campos do formulário
  const [transactionType, setTransactionType] = useState<CategoryType>('Expense');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [sourceId, setSourceId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isInstallment, setIsInstallment] = useState<boolean>(false);

  // Carrega os dados dos selects (categorias e fontes)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [cats, sources] = await Promise.all([
          getCategories(),
          getFinancialSources()
      ]);
      setCategories(cats);
      setFinancialSources(sources);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  // Função para lidar com a submissão do formulário
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Impede o recarregamento da página

    if (!description || !amount || !sourceId || !categoryId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const transactionData: TransactionData = {
      description,
      amount: parseFloat(amount),
      transactionType,
      financialSourceId: parseInt(sourceId),
      categoryId: parseInt(categoryId),
      isInstallment,
      purchaseDate: new Date().toISOString(), // Adiciona a data atual
    };
    
    // Chama a nossa API mockada
    await createTransaction(transactionData);
    
    // Limpa o formulário após o envio
    setDescription('');
    setAmount('');
    setSourceId('');
    setCategoryId('');
    setIsInstallment(false);
  };

  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-full max-w-md">
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

        {/* Checkbox de Parcelamento */}
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
        
        {/* Botão de Submissão */}
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