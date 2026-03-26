import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { loginUser, forgotPassword, resetPassword } from '../../../services/api';
import { AuthTokens, UserLoginData } from '../../../types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../../../utils/errors';

type LoginView = 'login' | 'forgot-step-1' | 'forgot-step-2';

interface LoginFormProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: (tokens: AuthTokens) => void;
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  show,
  onToggleShow,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-700 border-slate-600 rounded-md p-3 pr-11 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        placeholder={placeholder}
        required
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function LoginPanel({
  onLoginSuccess,
  onNavigateToRegister,
  onForgotPassword,
}: {
  onLoginSuccess: (tokens: AuthTokens) => void;
  onNavigateToRegister: () => void;
  onForgotPassword: () => void;
}) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const userData: UserLoginData = { email, password };

    try {
      const tokens = await loginUser(userData);
      toast.success('Login realizado com sucesso!');
      onLoginSuccess(tokens);
    } catch (apiError: unknown) {
      const message = extractErrorMessage(apiError, 'E-mail ou senha inválidos.');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
          E-mail
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
          placeholder="seu.email@exemplo.com"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
          Senha
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          disabled={isLoading}
          show={showPassword}
          onToggleShow={() => setShowPassword((prev) => !prev)}
        />
      </div>
      <div className="text-right">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs text-slate-400 hover:text-green-400 bg-transparent border-none cursor-pointer transition-colors"
        >
          Esqueci minha senha
        </button>
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-slate-500 disabled:scale-100"
        >
          {isLoading ? <SpinnerIcon /> : 'Entrar'}
        </button>
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="text-sm text-green-400 hover:text-green-300 bg-transparent border-none cursor-pointer"
        >
          Não tem uma conta? Crie uma aqui.
        </button>
      </div>
    </form>
  );
}

function ForgotStepOne({ onTokenReceived }: { onTokenReceived: (token: string) => void }) {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await forgotPassword({ email });
      onTokenReceived(response.token);
    } catch (apiError: unknown) {
      const message = extractErrorMessage(apiError, 'Erro ao solicitar redefinição de senha.');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-slate-400 text-sm">
        Informe o e-mail da sua conta. Um token de redefinição será gerado e exibido aqui.
      </p>
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-300 mb-2">
          Email
        </label>
        <input
          type="email"
          id="forgot-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
          placeholder="seu.email@exemplo.com"
          required
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-slate-500 disabled:scale-100"
      >
        {isLoading ? <SpinnerIcon /> : 'Gerar token'}
      </button>
    </form>
  );
}

function TokenDisplay({ token }: { token: string }) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-700 rounded-md p-3 flex items-center justify-between gap-2 mt-2">
      <span className="text-green-400 font-mono text-sm break-all">{token}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
        aria-label="Copiar token"
      >
        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

const PASSWORD_MIN_LENGTH = 8;
const UPPERCASE_PATTERN = /[A-Z]/;
const DIGIT_PATTERN = /[0-9]/;

function meetsPasswordComplexity(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    UPPERCASE_PATTERN.test(password) &&
    DIGIT_PATTERN.test(password)
  );
}

const PASSWORD_COMPLEXITY_MESSAGE =
  'Mínimo 8 caracteres, uma letra maiúscula e um número.';

function ForgotStepTwo({
  resetToken,
  onSuccess,
}: {
  resetToken: string;
  onSuccess: () => void;
}) {
  const [token, setToken] = useState<string>(resetToken);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const passwordsDoNotMatch =
    confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  const passwordFailsComplexity =
    newPassword.length > 0 && !meetsPasswordComplexity(newPassword);

  const isSubmitDisabled =
    isLoading ||
    passwordsDoNotMatch ||
    passwordFailsComplexity ||
    newPassword.length === 0 ||
    confirmNewPassword.length === 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ token, newPassword, confirmNewPassword });
      toast.success('Senha redefinida com sucesso! Faça login.');
      onSuccess();
    } catch (apiError: unknown) {
      const message = extractErrorMessage(apiError, 'Erro ao redefinir senha.');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-slate-400 text-sm">Copie o token abaixo e use-o para redefinir sua senha.</p>
      <TokenDisplay token={resetToken} />
      <div>
        <label htmlFor="reset-token" className="block text-sm font-medium text-slate-300 mb-2">
          Token
        </label>
        <input
          type="text"
          id="reset-token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition font-mono text-sm"
          placeholder="Cole o token aqui"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="reset-new-password" className="block text-sm font-medium text-slate-300 mb-2">
          Nova senha
        </label>
        <PasswordInput
          id="reset-new-password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número"
          disabled={isLoading}
          show={showNewPassword}
          onToggleShow={() => setShowNewPassword((prev) => !prev)}
        />
        {passwordFailsComplexity && (
          <p className="text-red-400 text-xs mt-1">{PASSWORD_COMPLEXITY_MESSAGE}</p>
        )}
      </div>
      <div>
        <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
          Confirmar nova senha
        </label>
        <PasswordInput
          id="reset-confirm-password"
          value={confirmNewPassword}
          onChange={setConfirmNewPassword}
          placeholder="Repita a nova senha"
          disabled={isLoading}
          show={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
        />
        {passwordsDoNotMatch && (
          <p className="text-red-400 text-xs mt-1">As senhas não coincidem.</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-slate-500 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {isLoading ? <SpinnerIcon /> : 'Redefinir senha'}
      </button>
    </form>
  );
}

export function LoginForm({ onNavigateToRegister, onLoginSuccess }: LoginFormProps) {
  const [view, setView] = useState<LoginView>('login');
  const [resetToken, setResetToken] = useState<string>('');

  const handleTokenReceived = (token: string) => {
    setResetToken(token);
    setView('forgot-step-2');
  };

  const handleResetSuccess = () => {
    setView('login');
    setResetToken('');
  };

  const forgotPasswordTitle =
    view === 'forgot-step-1' ? 'Recuperar senha' : 'Redefinir senha';

  return (
    <div className="bg-slate-800 text-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 transition-all duration-500">
      <div className="flex flex-col items-center mb-8 text-center">
        <img
          src="/piggino-logo.jpg"
          alt="Piggino Logo"
          className="w-24 h-auto mb-4 rounded-lg shadow-lg"
        />
        {view === 'login' ? (
          <>
            <h1 className="text-3xl font-bold text-slate-100">Bem-vindo ao Piggino</h1>
            <p className="text-slate-400 mt-1">Tome o controle das suas financas.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-100">{forgotPasswordTitle}</h1>
            <button
              type="button"
              onClick={() => setView('login')}
              className="text-xs text-slate-400 hover:text-green-400 mt-1 bg-transparent border-none cursor-pointer transition-colors"
            >
              Voltar ao login
            </button>
          </>
        )}
      </div>

      {view === 'login' && (
        <LoginPanel
          onLoginSuccess={onLoginSuccess}
          onNavigateToRegister={onNavigateToRegister}
          onForgotPassword={() => setView('forgot-step-1')}
        />
      )}

      {view === 'forgot-step-1' && (
        <ForgotStepOne onTokenReceived={handleTokenReceived} />
      )}

      {view === 'forgot-step-2' && (
        <ForgotStepTwo resetToken={resetToken} onSuccess={handleResetSuccess} />
      )}
    </div>
  );
}
