import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { CategoriesPage } from './components/CategoriesPage';
import { FinancialSourcesPage } from './components/FinancialSourcesPage'; // ✅ 1. Importa a nova página
import { MainLayout } from './components/MainLayout';

enum AuthView { Login, Register }
// ✅ 2. Adiciona a nova página ao tipo
type Page = 'dashboard' | 'transactions' | 'categories' | 'financial-sources';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('piggino_token'));
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('piggino_token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard'); // Volta para o dashboard após o login
  };

  const handleLogout = () => {
    localStorage.removeItem('piggino_token');
    setIsAuthenticated(false);
    setAuthView(AuthView.Login); 
  };

  if (isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#334155', color: '#f1f5f9' },
        }} />
        <MainLayout 
          activePage={currentPage} 
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        >
          {/* ✅ 3. O seu bloco de renderização, que já está correto */}
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'transactions' && <TransactionsPage />}
          {currentPage === 'categories' && <CategoriesPage />}
          {currentPage === 'financial-sources' && <FinancialSourcesPage />}
        </MainLayout>
      </>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 font-sans">
      <Toaster position="top-right" toastOptions={{
          style: { background: '#334155', color: '#f1f5f9' },
        }} />
      {authView === AuthView.Login ? (
        <LoginForm 
          onLoginSuccess={handleLoginSuccess}
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