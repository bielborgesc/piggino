import { useState, useEffect } from 'react'; // 1. Importe o useEffect
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { MainLayout } from './components/MainLayout';

enum AuthView { Login, Register }
type Page = 'dashboard' | 'transactions';

function App() {
  // O estado inicial agora é determinado pela presença do token
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('piggino_token'));
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // 2. useEffect para sincronizar o estado com o localStorage (opcional, mas bom para abas múltiplas)
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
  };

  // 3. Crie a função de logout
  const handleLogout = () => {
    localStorage.removeItem('piggino_token');
    setIsAuthenticated(false);
    // Garante que a próxima tela seja a de login
    setAuthView(AuthView.Login); 
  };

  if (isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#334155', color: '#f1f5f9' },
        }} />
        {/* 4. Passe a função de logout para o MainLayout */}
        <MainLayout 
          activePage={currentPage} 
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        >
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'transactions' && <TransactionsPage />}
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