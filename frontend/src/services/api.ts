import { mockCategories } from '../data/categories';
import { mockFinancialSources } from '../data/financialSources';
import { Category, FinancialSource, TransactionData } from '../types';

export const getCategories = async (): Promise<Category[]> => {
  console.log('A obter categorias (mock)...');
  await new Promise(resolve => setTimeout(resolve, 500)); 
  return mockCategories;
};

export const getFinancialSources = async (): Promise<FinancialSource[]> => {
  console.log('A obter fontes financeiras (mock)...');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockFinancialSources;
};

export const createTransaction = async (transactionData: TransactionData): Promise<any> => {
  console.log('A enviar nova transação:', transactionData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: Math.random(), ...transactionData };
};