import { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm'; // Importe o novo formulário

function App() {
  // Estado para controlar qual formulário está visível. true = Login, false = Cadastro
  const [isLoginView, setIsLoginView] = useState(true);

  // Funções para alternar a visualização
  const showRegisterView = () => setIsLoginView(false);
  const showLoginView = () => setIsLoginView(true);

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 font-sans">
      {isLoginView ? (
        <LoginForm onNavigateToRegister={showRegisterView} />
      ) : (
        <RegisterForm onNavigateToLogin={showLoginView} />
      )}
    </div>
  );
}

export default App;