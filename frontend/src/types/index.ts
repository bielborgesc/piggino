export type CategoryType = 'Income' | 'Expense';
export type FinancialSourceType = 'Card' | 'Account' | 'Cash';
export type RecurrenceScope = 'OnlyThis' | 'ThisAndFuture' | 'ThisAndPast' | 'All';
export type BudgetBucket = 'None' | 'Needs' | 'Wants' | 'Savings';
export type GoalType = 'EmergencyFund' | 'Savings' | 'Investment' | 'Debt' | 'Travel' | 'Custom';

export interface Goal {
  id: number;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color: string;
  type: GoalType;
  isCompleted: boolean;
  createdAt: string;
  userId: string;
  progressPercentage: number;
  monthsToGoal?: number;
}

export interface GoalData {
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color: string;
  type: GoalType;
}

export interface AddContributionData {
  amount: number;
}

// A interface Transaction agora corresponde ao TransactionReadDto do backend
export interface Transaction {
  id: number;
  description: string;
  syntheticId?: string;
  totalAmount: number;
  transactionType: CategoryType;
  purchaseDate: string;
  isInstallment: boolean;
  installmentCount?: number;
  currentInstallmentNumber?: number;
  isPaid: boolean;
  isFixed: boolean;
  dayOfMonth?: number;
  isRecurring: boolean;
  categoryId: number;
  categoryName?: string;
  financialSourceId: number;
  financialSourceName?: string;
  userId: string;
  cardInstallments?: CardInstallment[];
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  color?: string;
  userId: string;
  budgetBucket?: BudgetBucket;
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
    isFixed: boolean;
    dayOfMonth?: number;
    isInstallment: boolean;
    installmentCount?: number;
    purchaseDate: string;
    isRecurring: boolean;
    recurrenceScope?: RecurrenceScope;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  token: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface CategoryData {
  name: string;
  type: CategoryType;
  color?: string;
  budgetBucket?: BudgetBucket;
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
  dueDate: string;
}

export interface TokenPayload {
  name: string;
  id: string;
  email: string;
}

export interface InvoiceItem {
  transactionId: number;
  installmentId: number;
  description: string;
  amount: number;
  purchaseDate: string;
  installmentNumber: number;
  installmentCount: number;
  isPaid: boolean;
  categoryName: string | null;
}

export interface Invoice {
  financialSourceId: number;
  financialSourceName: string;
  closingDay: number;
  dueDay: number;
  month: string;
  closingDate: string;
  dueDate: string;
  totalAmount: number;
  items: InvoiceItem[];
}

export interface FixedBill {
  transactionId: number;
  description: string;
  totalAmount: number;
  categoryName: string | null;
  financialSourceName: string | null;
  dayOfMonth: number;
  isPaid: boolean;
  paymentId: number | null;
}

export interface MonthlyFixedBills {
  year: number;
  month: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  items: FixedBill[];
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export interface CategoryExpense {
  categoryName: string;
  total: number;
  percentage: number;
}

export interface TopExpense {
  description: string;
  amount: number;
  categoryName: string | null;
}

export interface SimulationItem {
  transactionId: number;
  description: string;
  financialSourceName: string;
  totalAmount: number;
  installmentCount: number;
  paidInstallments: number;
  remainingInstallments: number;
  remainingAmount: number;
  monthlyAmount: number;
  nextDueDate: string;
}

export interface Simulation {
  items: SimulationItem[];
  totalRemainingAmount: number;
  totalMonthlyCommitment: number;
}

export interface DashboardSummary {
  monthlySummaries: MonthlySummary[];
  expensesByCategory: CategoryExpense[];
  topExpenses: TopExpense[];
  currentMonthIncome: number;
  currentMonthExpenses: number;
  currentMonthBalance: number;
  pendingFixedBills: number;
  pendingInvoiceAmount: number;
  previousMonthIncome: number;
  previousMonthExpenses: number;
  incomeChangePercent: number;
  expensesChangePercent: number;
}

export interface HealthScoreComponent {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface HealthScore {
  score: number;
  grade: string;
  gradeLabel: string;
  components: HealthScoreComponent[];
  strengths: string[];
  warnings: string[];
}

export interface ContextualTip {
  title: string;
  message: string;
  icon: string;
  category: string;
  priority: string;
}

export interface TipsData {
  tips: ContextualTip[];
}

export interface UserSettings {
  is503020Enabled: boolean;
}

export interface BucketCategoryBreakdown {
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

export interface DebtItem {
  transactionId: number;
  description: string;
  financialSourceName: string;
  totalRemaining: number;
  monthlyPayment: number;
  totalInstallments: number;
  remainingInstallments: number;
  nextDueDate: string | null;
  priority_Avalanche: number;
  priority_Snowball: number;
}

export interface DebtSummary {
  debts: DebtItem[];
  totalDebt: number;
  totalMonthlyPayment: number;
  estimatedMonthsToFreedom: number;
}

export interface BudgetAnalysis {
  month: string;
  monthlyIncome: number;
  needsTarget: number;
  wantsTarget: number;
  savingsTarget: number;
  needsActual: number;
  wantsActual: number;
  savingsActual: number;
  unclassifiedActual: number;
  needsCategories: BucketCategoryBreakdown[];
  wantsCategories: BucketCategoryBreakdown[];
  savingsCategories: BucketCategoryBreakdown[];
  insights: string[];
}