import { useState, useEffect } from 'react';
import { X, KeyRound } from 'lucide-react';
import { getUserSettings, updateUserSettings, getCategories, getFinancialSources } from '../../../services/api';
import { UserSettings, Category, FinancialSource } from '../../../types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../../../utils/errors';

interface UserSettingsModalProps {
  onClose: () => void;
  onNavigateToCategories: () => void;
  onChangePassword: () => void;
}

export function UserSettingsModal({ onClose, onNavigateToCategories, onChangePassword }: UserSettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>({ is503020Enabled: false, isTitheModuleEnabled: false, isTelegramConnected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [financialSources, setFinancialSources] = useState<FinancialSource[]>([]);

  useEffect(() => {
    getUserSettings()
      .then(setSettings)
      .catch(() => {
        toast.error('Não foi possível carregar as configurações.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!settings.isTitheModuleEnabled) return;

    Promise.all([getCategories(), getFinancialSources()])
      .then(([categories, sources]) => {
        setExpenseCategories(categories.filter(c => c.type === 'Expense'));
        setFinancialSources(sources);
      })
      .catch(() => {
        toast.error('Não foi possível carregar categorias e fontes financeiras.');
      });
  }, [settings.isTitheModuleEnabled]);

  const handleToggle503020 = async () => {
    const updated: UserSettings = { ...settings, is503020Enabled: !settings.is503020Enabled };
    setIsSaving(true);

    try {
      const saved = await updateUserSettings(updated);
      setSettings(saved);
      toast.success(saved.is503020Enabled ? 'Método 50/30/20 ativado.' : 'Método 50/30/20 desativado.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao salvar configurações.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTithe = async () => {
    const updated: UserSettings = { ...settings, isTitheModuleEnabled: !settings.isTitheModuleEnabled };
    setIsSaving(true);

    try {
      const saved = await updateUserSettings(updated);
      setSettings(saved);
      toast.success(saved.isTitheModuleEnabled ? 'Módulo Dízimo ativado.' : 'Módulo Dízimo desativado.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao salvar configurações.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitheCategoryChange = async (value: string) => {
    const titheCategoryId = value ? Number(value) : null;
    const updated: UserSettings = { ...settings, titheCategoryId };
    setIsSaving(true);

    try {
      const saved = await updateUserSettings(updated);
      setSettings(saved);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao salvar categoria do dízimo.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitheFinancialSourceChange = async (value: string) => {
    const titheFinancialSourceId = value ? Number(value) : null;
    const updated: UserSettings = { ...settings, titheFinancialSourceId };
    setIsSaving(true);

    try {
      const saved = await updateUserSettings(updated);
      setSettings(saved);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao salvar fonte financeira do dízimo.'));
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
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-700 shrink-0">
          <h2 className="text-lg font-bold text-white">Configurações</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {isLoading ? (
            <p className="text-slate-400 text-sm text-center">Carregando...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-semibold">Método 50/30/20</p>
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
                  onClick={handleToggle503020}
                  disabled={isSaving}
                  aria-label="Ativar ou desativar método 50/30/20"
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

              <div className="border-t border-slate-700 pt-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-semibold">Módulo Dízimo</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Gera automaticamente uma transação de 10% da sua receita mensal como dízimo.
                  </p>
                  {settings.isTitheModuleEnabled && (
                    <>
                      <p className="text-slate-500 text-xs mt-2">
                        Visível no Dashboard para acompanhar e gerar o dízimo do mês.
                      </p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-slate-400 text-xs mb-1">Categoria do dízimo</label>
                          <select
                            value={settings.titheCategoryId ?? ''}
                            onChange={e => handleTitheCategoryChange(e.target.value)}
                            disabled={isSaving}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50"
                          >
                            <option value="">Selecione uma categoria</option>
                            {expenseCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs mb-1">Fonte financeira</label>
                          <select
                            value={settings.titheFinancialSourceId ?? ''}
                            onChange={e => handleTitheFinancialSourceChange(e.target.value)}
                            disabled={isSaving}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50"
                          >
                            <option value="">Selecione uma fonte financeira</option>
                            {financialSources.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-slate-500 text-xs">
                          Se não configurado, o sistema usará a categoria 'Dízimo' ou a primeira disponível.
                        </p>
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                          <p className="text-amber-300 text-xs leading-relaxed">
                            Para que o dízimo seja calculado automaticamente, ative a opção{' '}
                            <span className="font-semibold">Incluir no dízimo</span> em cada categoria de renda desejada.{' '}
                            <button
                              type="button"
                              onClick={handleCategoriesLink}
                              className="underline hover:text-amber-200 transition-colors"
                            >
                              Ir para Categorias
                            </button>
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleToggleTithe}
                  disabled={isSaving}
                  aria-label="Ativar ou desativar módulo dízimo"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    settings.isTitheModuleEnabled ? 'bg-amber-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${
                      settings.isTitheModuleEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>


              <div className="border-t border-slate-700 pt-4">
                <button
                  onClick={onChangePassword}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition-colors"
                >
                  <KeyRound size={16} />
                  Alterar Senha
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
