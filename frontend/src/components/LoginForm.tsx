import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../services/api';
import { AuthTokens, UserLoginData } from '../types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../utils/errors';

interface LoginFormProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: (tokens: AuthTokens) => void;
}

export function LoginForm({ onNavigateToRegister, onLoginSuccess }: LoginFormProps) {
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
      toast.success('Login successful!');
      onLoginSuccess(tokens);
    } catch (apiError: unknown) {
      const message = extractErrorMessage(apiError, 'E-mail ou senha inválidos.');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 text-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 transition-all duration-500">
      <div className="flex flex-col items-center mb-8 text-center">
        <img
          src="/piggino-logo.jpg"
          alt="Piggino Logo"
          className="w-24 h-auto mb-4 rounded-lg shadow-lg"
        />
        <h1 className="text-3xl font-bold text-slate-100">Welcome to Piggino</h1>
        <p className="text-slate-400 mt-1">Take control of your finances.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            placeholder="your.email@example.com"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 rounded-md p-3 pr-11 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-slate-500 disabled:scale-100"
          >
            {isLoading ? (
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
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>
      <div className="text-center mt-6">
        <button
          onClick={onNavigateToRegister}
          className="text-sm text-green-400 hover:text-green-300 bg-transparent border-none cursor-pointer"
        >
          Don't have an account? Create one here.
        </button>
      </div>
    </div>
  );
}
