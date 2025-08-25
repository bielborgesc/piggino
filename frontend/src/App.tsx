import { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage'; // Importe a nova página
import { MainLayout } from './components/MainLayout'; // Importe o novo layout

enum AuthView { Login, Register }
type Page = 'dashboard' | 'transactions';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const handleLoginSuccess = () => setIsAuthenticated(true);

  if (isAuthenticated) {
    return (
      <MainLayout activePage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'transactions' && <TransactionsPage />}
      </MainLayout>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 font-sans">
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