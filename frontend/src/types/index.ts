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
  categoryName?: string; // ✅ Adicionar
  financialSourceId: number;
  financialSourceName?: string; // ✅ Adicionar
  userId: string;
  cardInstallments?: CardInstallment[];
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  userId: string;
}

// ✅ CORREÇÃO: Adicione as propriedades opcionais aqui
export interface FinancialSource {
  id: number;
  name: string;
  type: FinancialSourceType;
  closingDay?: number; // Campo opcional
  dueDay?: number;   // Campo opcional
  userId: string;
}

export interface TransactionData {
    description: string;
    totalAmount: number;
    transactionType: CategoryType;
    financialSourceId: number;
    categoryId: number;
    isInstallment: boolean;
    installmentCount?: number;
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

export interface CategoryData {
  name: string;
  type: CategoryType;
}

export interface FinancialSourceData {
  name: string;
  type: FinancialSourceType;
  closingDay?: number | null;
  dueDay?: number | null;
}

export interface CardInstallment {
  id: number;
  installmentNumber: number;
  amount: number;
  isPaid: boolean;
  transactionId: number;
}