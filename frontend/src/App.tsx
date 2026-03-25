import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { FinancialSourcesPage } from './pages/FinancialSourcesPage';
import { InvoicePage } from './pages/InvoicePage';
import { FixedBillsPage } from './pages/FixedBillsPage';
import { GoalsPage } from './pages/GoalsPage';
import { WealthProjectionPage } from './pages/WealthProjectionPage';
import { DebtPlanningPage } from './pages/DebtPlanningPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { MainLayout } from './components/layout/MainLayout';
import { ChangePasswordModal } from './components/features/auth/ChangePasswordModal';
import { UserSettingsModal } from './components/features/settings/UserSettingsModal';
import { useAuth } from './hooks/useAuth';

type Page = 'dashboard' | 'transactions' | 'categories' | 'financial-sources' | 'invoices' | 'fixed-bills' | 'goals' | 'projection' | 'debts' | 'onboarding';

const TOAST_STYLES = { style: { background: '#334155', color: '#f1f5f9' } };

function App() {
  const { isAuthenticated, onLoginSuccess, onLogout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  if (isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" toastOptions={TOAST_STYLES} />
        {isChangePasswordOpen && (
          <ChangePasswordModal
            onClose={() => setIsChangePasswordOpen(false)}
            onLogout={onLogout}
          />
        )}
        {isSettingsOpen && (
          <UserSettingsModal
            onClose={() => setIsSettingsOpen(false)}
            onNavigateToCategories={() => setCurrentPage('categories')}
            onChangePassword={() => { setIsSettingsOpen(false); setIsChangePasswordOpen(true); }}
          />
        )}
        <MainLayout
          activePage={currentPage}
          onNavigate={setCurrentPage}
          onLogout={onLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
        >
          {currentPage === 'dashboard' && <DashboardPage onNavigateToCategories={() => setCurrentPage('categories')} onNavigateToGoals={() => setCurrentPage('goals')} />}
          {currentPage === 'transactions' && <TransactionsPage />}
          {currentPage === 'categories' && <CategoriesPage />}
          {currentPage === 'financial-sources' && <FinancialSourcesPage />}
          {currentPage === 'invoices' && <InvoicePage />}
          {currentPage === 'fixed-bills' && <FixedBillsPage />}
          {currentPage === 'goals' && <GoalsPage />}
          {currentPage === 'projection' && <WealthProjectionPage />}
          {currentPage === 'debts' && <DebtPlanningPage />}
          {currentPage === 'onboarding' && <OnboardingPage onFinish={() => setCurrentPage('dashboard')} />}
        </MainLayout>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={TOAST_STYLES} />
      <LoginPage onLoginSuccess={onLoginSuccess} />
    </>
  );
}

export default App;
