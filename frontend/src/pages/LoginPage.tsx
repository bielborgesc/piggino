import { useState } from 'react';
import { LoginForm } from '../components/features/auth/LoginForm';
import { RegisterForm } from '../components/features/auth/RegisterForm';
import { AuthTokens } from '../types';

enum AuthView { Login, Register }

interface LoginPageProps {
  onLoginSuccess: (tokens: AuthTokens) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 font-sans">
      {authView === AuthView.Login ? (
        <LoginForm
          onLoginSuccess={onLoginSuccess}
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
