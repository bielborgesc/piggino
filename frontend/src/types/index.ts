export type CategoryType = 'Income' | 'Expense';
export type FinancialSourceType = 'Card' | 'Account' | 'Cash';

// A interface Transaction agora corresponde ao TransactionReadDto do backend
export interface Transaction {
  id: number;
  description: string;
  totalAmount: number;
  transactionType: CategoryType;
  purchaseDate: string; // A API envia como string no formato ISO
  isInstallment: boolean;
  installmentCount?: number;
  isPaid: boolean;
  categoryId: number;
  financialSourceId: number;
  userId: string;
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  userId: string;
}

export interface FinancialSource {
  id: number;
  name: string;
  type: FinancialSourceType;
  userId: string;
}

export interface TransactionData {
    description: string;
    totalAmount: number;
    transactionType: CategoryType;
    financialSourceId: number;
    categoryId: number;
    isInstallment: boolean;
    purchaseDate: string;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}