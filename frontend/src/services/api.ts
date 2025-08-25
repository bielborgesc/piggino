import axios from 'axios';
import { 
  Category, 
  FinancialSource, 
  TransactionData, 
  UserRegistrationData,
  UserLoginData // Importe o novo tipo
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

// --- Funções da API de Autenticação ---

export const registerUser = async (userData: UserRegistrationData) => {
  const response = await apiClient.post('/User', userData);
  return response.data;
};

// Adicione a nova função de login
export const loginUser = async (userData: UserLoginData) => {
  const response = await apiClient.post('/Auth/login', userData);
  return response.data; // A resposta deve conter o token, ex: { token: "..." }
};


// --- Funções da API (placeholders) ---

export const getCategories = async (): Promise<Category[]> => {
  console.log('Buscando categorias da API real...');
  return [];
};

export const getFinancialSources = async (): Promise<FinancialSource[]> => {
  console.log('Buscando fontes financeiras da API real...');
  return [];
};

export const createTransaction = async (transactionData: TransactionData): Promise<any> => {
  console.log('Enviando nova transação para a API real:', transactionData);
  return { id: Math.random(), ...transactionData };
};

export default apiClient;