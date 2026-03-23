import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getUserSettings, updateUserSettings } from '../../../services/api';
import { UserSettings } from '../../../types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../../../utils/errors';

interface UserSettingsModalProps {
  onClose: () => void;
  onNavigateToCategories: () => void;
}

export function UserSettingsModal({ onClose, onNavigateToCategories }: UserSettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>({ is503020Enabled: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getUserSettings()
      .then(setSettings)
      .catch(() => {
        toast.error('Nao foi possivel carregar as configuracoes.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = async () => {
    const updated: UserSettings = { is503020Enabled: !settings.is503020Enabled };
    setIsSaving(true);

    try {
      const saved = await updateUserSettings(updated);
      setSettings(saved);
      toast.success(saved.is503020Enabled ? 'Metodo 50/30/20 ativado.' : 'Metodo 50/30/20 desativado.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao salvar configuracoes.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoriesLink = () => {
    onClose();
    onNavigateToCategories();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Configuracoes</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <p className="text-slate-400 text-sm text-center">Carregando...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-semibold">Metodo 50/30/20</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Distribua sua renda em tres categorias: Necessidades, Desejos e Reservas.
                  </p>
                  {settings.is503020Enabled && (
                    <p className="text-slate-500 text-xs mt-2">
                      Necessidades (50%) · Desejos (30%) · Reservas (20%)
                    </p>
                  )}
                </div>
                <button
                  onClick={handleToggle}
                  disabled={isSaving}
                  aria-label="Ativar ou desativar metodo 50/30/20"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    settings.is503020Enabled ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${
                      settings.is503020Enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {settings.is503020Enabled && (
                <button
                  onClick={handleCategoriesLink}
                  className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                >
                  Classificar categorias &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
