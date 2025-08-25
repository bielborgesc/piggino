import { useState } from 'react';
import { Toaster } from 'react-hot-toast'; // 1. Importe o Toaster
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { MainLayout } from './components/MainLayout';
import { TransactionsPage } from './components/TransactionsPage';

enum AuthView { Login, Register }
type Page = 'dashboard' | 'transactions';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const handleLoginSuccess = () => setIsAuthenticated(true);

  if (isAuthenticated) {
    return (
      <>
        {/* 2. Adicione o Toaster aqui também para a área logada */}
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#334155', // slate-700
            color: '#f1f5f9', // slate-100
          },
        }} />
        <MainLayout activePage={currentPage} onNavigate={setCurrentPage}>
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'transactions' && <TransactionsPage />}
        </MainLayout>
      </>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 font-sans">
      {/* 2. Adicione o Toaster aqui para as telas de login/cadastro */}
      <Toaster position="top-right" toastOptions={{
          style: {
            background: '#334155', // slate-700
            color: '#f1f5f9', // slate-100
          },
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