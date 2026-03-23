import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../services/api';
import { ChangePasswordData } from '../types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../utils/errors';

interface ChangePasswordModalProps {
  onClose: () => void;
  onLogout: () => Promise<void>;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

function measurePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasMinLength, hasUpperCase, hasDigit, hasSpecial].filter(Boolean).length;

  if (score <= 2) return 'weak';
  if (score === 3) return 'medium';
  return 'strong';
}

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: 'Fraca',
  medium: 'Média',
  strong: 'Forte',
};

const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  weak: 'bg-red-500',
  medium: 'bg-yellow-500',
  strong: 'bg-green-500',
};

const STRENGTH_WIDTH: Record<PasswordStrength, string> = {
  weak: 'w-1/3',
  medium: 'w-2/3',
  strong: 'w-full',
};

function StrengthIndicator({ password }: { password: string }) {
  if (password.length === 0) return null;

  const strength = measurePasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="w-full bg-slate-600 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${STRENGTH_COLOR[strength]} ${STRENGTH_WIDTH[strength]}`}
        />
      </div>
      <p className={`text-xs mt-1 ${STRENGTH_COLOR[strength].replace('bg-', 'text-')}`}>
        Força da senha: {STRENGTH_LABEL[strength]}
      </p>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  showStrength,
  hasError,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  showStrength?: boolean;
  hasError?: boolean;
}) {
  const [show, setShow] = useState<boolean>(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-700 rounded-md p-3 pr-11 text-slate-100 placeholder-slate-500 focus:ring-2 transition ${
            hasError
              ? 'border border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-600 focus:ring-green-500 focus:border-green-500'
          }`}
          placeholder={placeholder}
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showStrength && <StrengthIndicator password={value} />}
    </div>
  );
}

export function ChangePasswordModal({ onClose, onLogout }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const passwordsDoNotMatch =
    confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  const isSubmitDisabled =
    isLoading ||
    currentPassword.length === 0 ||
    newPassword.length === 0 ||
    confirmNewPassword.length === 0 ||
    passwordsDoNotMatch;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    const data: ChangePasswordData = { currentPassword, newPassword, confirmNewPassword };

    try {
      await changePassword(data);
      toast.success('Senha alterada com sucesso!');
      onClose();
      await onLogout();
    } catch (apiError: unknown) {
      const message = extractErrorMessage(apiError, 'Erro ao alterar senha.');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Alterar senha</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            id="current-password"
            label="Senha atual"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="••••••••"
            disabled={isLoading}
          />

          <PasswordField
            id="new-password"
            label="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número"
            disabled={isLoading}
            showStrength
          />

          <PasswordField
            id="confirm-new-password"
            label="Confirmar nova senha"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            placeholder="Repita a nova senha"
            disabled={isLoading}
            hasError={passwordsDoNotMatch}
          />
          {passwordsDoNotMatch && (
            <p className="text-red-400 text-xs -mt-3">As senhas não coincidem.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="flex-1 flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                'Alterar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
