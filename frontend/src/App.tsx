import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { CategoriesPage } from './components/CategoriesPage';
import { FinancialSourcesPage } from './components/FinancialSourcesPage';
import { InvoicePage } from './components/InvoicePage';
import { FixedBillsPage } from './components/FixedBillsPage';
import { MainLayout } from './components/MainLayout';
import { useAuth } from './hooks/useAuth';

enum AuthView { Login, Register }
type Page = 'dashboard' | 'transactions' | 'categories' | 'financial-sources' | 'invoices' | 'fixed-bills';

const toastStyles = { style: { background: '#334155', color: '#f1f5f9' } };

function App() {
  const { isAuthenticated, onLoginSuccess, onLogout } = useAuth();
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  if (isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" toastOptions={toastStyles} />
        <MainLayout
          activePage={currentPage}
          onNavigate={setCurrentPage}
          onLogout={onLogout}
        >
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'transactions' && <TransactionsPage />}
          {currentPage === 'categories' && <CategoriesPage />}
          {currentPage === 'financial-sources' && <FinancialSourcesPage />}
          {currentPage === 'invoices' && <InvoicePage />}
          {currentPage === 'fixed-bills' && <FixedBillsPage />}
        </MainLayout>
      </>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 font-sans">
      <Toaster position="top-right" toastOptions={toastStyles} />
      {authView === AuthView.Login ? (
        <LoginForm
          onLoginSuccess={(tokens) => {
            onLoginSuccess(tokens);
            handleLoginSuccess();
          }}
          onNavigateToRegister={() => setAuthView(AuthView.Register)}
        />
      ) : (
        <RegisterForm
          onNavigateToLogin={() => setAuthView(AuthView.Login)}
        />
      )}
    </div>
  );
}

export default App;
