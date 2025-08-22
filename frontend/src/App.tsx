import { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard'; // Importe o novo Dashboard

// Para simplificar, vamos definir uma enumeração para as diferentes telas
enum AuthView {
  Login,
  Register,
}

function App() {
  // Estado para controlar se o usuário está logado
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Estado para alternar entre login e cadastro
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);

  // Função de simulação de login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Se o usuário estiver autenticado, mostre o Dashboard
  if (isAuthenticated) {
    return <Dashboard />;
  }

  // Caso contrário, mostre a tela de Login ou Cadastro
  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 font-sans">
      {authView === AuthView.Login ? (
        // Passamos a função de login e a de navegação
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