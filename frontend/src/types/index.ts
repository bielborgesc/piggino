export type CategoryType = 'Income' | 'Expense';
export type FinancialSourceType = 'Card' | 'Account' | 'Cash';

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

export interface FinancialSource {
  id: number;
  name: string;
  type: FinancialSourceType;
}

export interface TransactionData {
    description: string;
    amount: number;
    transactionType: CategoryType;
    financialSourceId: number;
    categoryId: number;
    isInstallment: boolean;
    purchaseDate: string;
}