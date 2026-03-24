export type TransactionType = 'Income' | 'Expense';

export interface Category {
  id: number;
  name: string;
  type: string;
}

export interface FinancialSource {
  id: number;
  name: string;
}

export interface BotContext {
  categories: Category[];
  financialSources: FinancialSource[];
}

export interface TopCategory {
  name: string;
  amount: number;
}

export interface BotSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  balance: number;
  topCategories: TopCategory[];
}

export interface ParsedTransaction {
  description: string;
  totalAmount: number;
  transactionType: TransactionType;
  categoryId: number;
  financialSourceId: number;
  purchaseDate: string;
}

export interface BotLinkTokenResponse {
  token: string;
  expiresAt: string;
}
