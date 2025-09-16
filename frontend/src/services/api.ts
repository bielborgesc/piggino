import axios from 'axios';
import { 
  Transaction,
  Category, 
  FinancialSource, 
  TransactionData, 
  UserRegistrationData,
  UserLoginData,
  CategoryType,
  FinancialSourceData
} from '../types';

const API_BASE_URL = 'https://localhost:7216/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('piggino_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Funções da API de Autenticação (permanecem as mesmas) ---
export const registerUser = async (userData: UserRegistrationData) => {
  const response = await apiClient.post('/User', userData);
  return response.data;
};

export const loginUser = async (userData: UserLoginData) => {
  const response = await apiClient.post('/Auth/login', userData);
  return response.data;
};

// --- Funções da API de Transações ---
export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get('/Transactions');
  return response.data;
};

// ✅ NOVA IMPLEMENTAÇÃO
export const createTransaction = async (transactionData: TransactionData): Promise<Transaction> => {
  const response = await apiClient.post('/Transactions', transactionData);
  return response.data;
};


// --- Funções da API de Categorias e Fontes ---
// ✅ NOVA IMPLEMENTAÇÃO
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get('/Categories');
  return response.data;
};

// ✅ NOVA FUNÇÃO
export const createCategory = async (categoryData: { name: string, type: CategoryType }): Promise<Category> => {
  const response = await apiClient.post('/Categories', categoryData);
  return response.data;
};

// ✅ NOVA FUNÇÃO
export const updateCategory = async (id: number, categoryData: { name: string, type: CategoryType }): Promise<void> => {
  await apiClient.put(`/Categories/${id}`, categoryData);
};

// ✅ NOVA FUNÇÃO
export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/Categories/${id}`);
};


// ✅ NOVA IMPLEMENTAÇÃO
export const getFinancialSources = async (): Promise<FinancialSource[]> => {
  const response = await apiClient.get('/FinancialSources');
  return response.data;
};

export const createFinancialSource = async (data: FinancialSourceData): Promise<FinancialSource> => {
  const response = await apiClient.post('/FinancialSources', data);
  return response.data;
};

export const updateFinancialSource = async (id: number, data: FinancialSourceData): Promise<void> => {
  await apiClient.put(`/FinancialSources/${id}`, data);
};

export const deleteFinancialSource = async (id: number): Promise<void> => {
  await apiClient.delete(`/FinancialSources/${id}`);
};

export const updateTransaction = async (id: number, transactionData: TransactionData): Promise<void> => {
  await apiClient.put(`/Transactions/${id}`, transactionData);
};

export const deleteTransaction = async (id: number): Promise<void> => {
  await apiClient.delete(`/Transactions/${id}`);
};

export default apiClient;