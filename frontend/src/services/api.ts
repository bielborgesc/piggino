import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  Transaction,
  Category,
  FinancialSource,
  TransactionData,
  UserRegistrationData,
  UserLoginData,
  CategoryType,
  CategoryData,
  FinancialSourceData,
  RecurrenceScope,
  Invoice,
  MonthlyFixedBills,
  DashboardSummary,
  AuthTokens,
  RefreshTokenData,
  Simulation,
  ChangePasswordData,
  ForgotPasswordData,
  ForgotPasswordResponse,
  ResetPasswordData,
  UserSettings,
  BudgetAnalysis,
  Goal,
  GoalData,
  AddContributionData,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const ACCESS_TOKEN_KEY = 'piggino_token';
const REFRESH_TOKEN_KEY = 'piggino_refresh_token';

// --- Token storage helpers ---

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// --- Axios instance ---

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request interceptor: attach access token ---

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// --- Token refresh state (prevents concurrent refresh storms) ---

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

function drainPendingRequests(newToken: string): void {
  pendingRequests.forEach((resolve) => resolve(newToken));
  pendingRequests = [];
}

function rejectPendingRequests(): void {
  pendingRequests.forEach((resolve) => resolve(''));
  pendingRequests = [];
}

// --- Response interceptor: handle 401 with token refresh ---

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    const isUnauthorized = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest.url?.includes('/Auth/refresh');
    const alreadyRetried = originalRequest._retried === true;

    if (!isUnauthorized || isRefreshEndpoint || alreadyRetried) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    if (isRefreshing) {
      return new Promise<string>((resolve) => {
        pendingRequests.push(resolve);
      }).then((newToken) => {
        if (!newToken) return Promise.reject(error);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;

    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) {
      isRefreshing = false;
      rejectPendingRequests();
      clearTokens();
      window.dispatchEvent(new Event('piggino:auth-expired'));
      return Promise.reject(error);
    }

    try {
      const tokens = await refreshAccessToken({ refreshToken: storedRefreshToken });
      storeTokens(tokens);
      drainPendingRequests(tokens.accessToken);
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return apiClient(originalRequest);
    } catch {
      rejectPendingRequests();
      clearTokens();
      window.dispatchEvent(new Event('piggino:auth-expired'));
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

// --- Auth API ---

export const registerUser = async (userData: UserRegistrationData): Promise<void> => {
  await apiClient.post('/User', userData);
};

export const loginUser = async (userData: UserLoginData): Promise<AuthTokens> => {
  const response = await apiClient.post<AuthTokens>('/Auth/login', userData);
  return response.data;
};

export const refreshAccessToken = async (data: RefreshTokenData): Promise<AuthTokens> => {
  const response = await apiClient.post<AuthTokens>('/Auth/refresh', data);
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await apiClient.post('/Auth/logout');
};

export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  await apiClient.post('/Auth/change-password', data);
};

export const forgotPassword = async (data: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
  const response = await apiClient.post<ForgotPasswordResponse>('/Auth/forgot-password', data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordData): Promise<void> => {
  await apiClient.post('/Auth/reset-password', data);
};

// --- Transactions API ---

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get<Transaction[]>('/Transactions');
  return response.data;
};

export const createTransaction = async (transactionData: TransactionData): Promise<Transaction> => {
  const response = await apiClient.post<Transaction>('/Transactions', transactionData);
  return response.data;
};

export const updateTransaction = async (id: number, transactionData: TransactionData): Promise<void> => {
  await apiClient.put(`/Transactions/${id}`, transactionData);
};

export const deleteTransaction = async (id: number, scope: RecurrenceScope = 'OnlyThis'): Promise<void> => {
  await apiClient.delete(`/Transactions/${id}`, { params: { scope } });
};

export const deleteInstallmentsByScope = async (
  transactionId: number,
  installmentNumber: number,
  scope: RecurrenceScope
): Promise<void> => {
  await apiClient.delete(`/Transactions/${transactionId}/installments/${installmentNumber}`, { params: { scope } });
};

export const updateInstallmentsByScope = async (
  transactionId: number,
  installmentNumber: number,
  transactionData: TransactionData,
  scope: RecurrenceScope
): Promise<void> => {
  await apiClient.put(`/Transactions/${transactionId}/installments/${installmentNumber}`, {
    ...transactionData,
    recurrenceScope: scope,
    installmentNumber,
  });
};

export const toggleInstallmentPaidStatus = async (installmentId: number): Promise<void> => {
  await apiClient.patch(`/Transactions/installments/${installmentId}/toggle-paid`);
};

export const toggleTransactionPaidStatus = async (transactionId: number): Promise<void> => {
  await apiClient.patch(`/Transactions/${transactionId}/toggle-paid`);
};

export const getInvoice = async (financialSourceId: number, month: string): Promise<Invoice> => {
  const response = await apiClient.get<Invoice>('/Transactions/invoices', {
    params: { financialSourceId, month },
  });
  return response.data;
};

export const payInvoice = async (financialSourceId: number, month: string): Promise<void> => {
  await apiClient.post('/Transactions/invoices/pay', null, {
    params: { financialSourceId, month },
  });
};

export const getFixedBills = async (month: string): Promise<MonthlyFixedBills> => {
  const response = await apiClient.get<MonthlyFixedBills>('/Transactions/fixed-bills', { params: { month } });
  return response.data;
};

export const payFixedBill = async (transactionId: number, month: string): Promise<void> => {
  await apiClient.post(`/Transactions/fixed-bills/${transactionId}/pay`, null, {
    params: { month },
  });
};

export const unpayFixedBill = async (transactionId: number, month: string): Promise<void> => {
  await apiClient.delete(`/Transactions/fixed-bills/${transactionId}/pay`, {
    params: { month },
  });
};

export const getDashboardSummary = async (months = 6): Promise<DashboardSummary> => {
  const response = await apiClient.get<DashboardSummary>('/Transactions/summary', { params: { months } });
  return response.data;
};

export const settleInstallments = async (transactionId: number): Promise<void> => {
  await apiClient.post(`/Transactions/${transactionId}/settle`);
};

export const getSimulation = async (): Promise<Simulation> => {
  const response = await apiClient.get<Simulation>('/Transactions/simulation');
  return response.data;
};

// --- Categories API ---

export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/Categories');
  return response.data;
};

export const createCategory = async (categoryData: CategoryData): Promise<Category> => {
  const response = await apiClient.post<Category>('/Categories', categoryData);
  return response.data;
};

export const updateCategory = async (id: number, categoryData: CategoryData): Promise<void> => {
  await apiClient.put(`/Categories/${id}`, categoryData);
};

export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/Categories/${id}`);
};

// --- Financial Sources API ---

export const getFinancialSources = async (): Promise<FinancialSource[]> => {
  const response = await apiClient.get<FinancialSource[]>('/FinancialSources');
  return response.data;
};

export const createFinancialSource = async (data: FinancialSourceData): Promise<FinancialSource> => {
  const response = await apiClient.post<FinancialSource>('/FinancialSources', data);
  return response.data;
};

export const updateFinancialSource = async (id: number, data: FinancialSourceData): Promise<void> => {
  await apiClient.put(`/FinancialSources/${id}`, data);
};

export const deleteFinancialSource = async (id: number): Promise<void> => {
  await apiClient.delete(`/FinancialSources/${id}`);
};

// --- User Settings API ---

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await apiClient.get<UserSettings>('/user-settings');
  return response.data;
};

export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  const response = await apiClient.put<UserSettings>('/user-settings', settings);
  return response.data;
};

// --- Budget Analysis API ---

export const getBudgetAnalysis = async (month: string): Promise<BudgetAnalysis> => {
  const response = await apiClient.get<BudgetAnalysis>('/Transactions/budget-analysis', { params: { month } });
  return response.data;
};

// --- Goals API ---

export const getGoals = async (): Promise<Goal[]> => {
  const response = await apiClient.get<Goal[]>('/Goals');
  return response.data;
};

export const getGoal = async (id: number): Promise<Goal> => {
  const response = await apiClient.get<Goal>(`/Goals/${id}`);
  return response.data;
};

export const createGoal = async (data: GoalData): Promise<Goal> => {
  const response = await apiClient.post<Goal>('/Goals', data);
  return response.data;
};

export const updateGoal = async (id: number, data: GoalData): Promise<void> => {
  await apiClient.put(`/Goals/${id}`, data);
};

export const deleteGoal = async (id: number): Promise<void> => {
  await apiClient.delete(`/Goals/${id}`);
};

export const addContribution = async (id: number, data: AddContributionData): Promise<Goal> => {
  const response = await apiClient.post<Goal>(`/Goals/${id}/contribute`, data);
  return response.data;
};

// Unused export kept for CategoryType import consumers
export type { CategoryType };

export default apiClient;
