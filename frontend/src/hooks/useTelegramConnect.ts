import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  generateBotLinkToken,
  disconnectTelegram,
  disconnectSpecificTelegram,
  getTelegramConnections,
} from '../services/api';
import { TelegramConnection } from '../types';
import { extractErrorMessage } from '../utils/errors';

const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'PigginoBot';
const CONNECT_COMMAND_PREFIX = '/conectar';

interface UseTelegramConnectResult {
  isConnected: boolean;
  isLoadingStatus: boolean;
  connections: TelegramConnection[];
  token: string | null;
  expiresAt: Date | null;
  secondsRemaining: number;
  isGenerating: boolean;
  isDisconnecting: boolean;
  botUsername: string;
  generateToken: () => Promise<void>;
  disconnect: () => Promise<void>;
  disconnectSpecific: (id: number) => Promise<void>;
  copyToken: () => Promise<void>;
  copyCommand: () => Promise<void>;
}

export function useTelegramConnect(): UseTelegramConnectResult {
  const [connections, setConnections] = useState<TelegramConnection[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(
    (expiry: Date) => {
      stopCountdown();

      const tick = () => {
        const remaining = Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));
        setSecondsRemaining(remaining);

        if (remaining === 0) {
          stopCountdown();
          setToken(null);
          setExpiresAt(null);
        }
      };

      tick();
      countdownIntervalRef.current = setInterval(tick, 1000);
    },
    [stopCountdown]
  );

  useEffect(() => {
    getTelegramConnections()
      .then((data) => setConnections(data))
      .catch(() => {
        toast.error('Não foi possível verificar o status do Telegram.');
      })
      .finally(() => setIsLoadingStatus(false));

    return () => stopCountdown();
  }, [stopCountdown]);

  const generateToken = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateBotLinkToken();
      const expiry = new Date(result.expiresAt);
      setToken(result.token);
      setExpiresAt(expiry);
      startCountdown(expiry);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao gerar código de conexão.'));
    } finally {
      setIsGenerating(false);
    }
  }, [startCountdown]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnectTelegram();
      setConnections([]);
      setToken(null);
      setExpiresAt(null);
      stopCountdown();
      toast.success('Todas as contas do Telegram foram desconectadas.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao desconectar o Telegram.'));
    } finally {
      setIsDisconnecting(false);
    }
  }, [stopCountdown]);

  const disconnectSpecific = useCallback(async (id: number) => {
    try {
      await disconnectSpecificTelegram(id);
      setConnections((previous) => previous.filter((c) => c.id !== id));
      toast.success('Conta do Telegram desconectada.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao desconectar a conta do Telegram.'));
    }
  }, []);

  const copyToken = useCallback(async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Código copiado!');
    } catch {
      toast.error('Não foi possível copiar o código.');
    }
  }, [token]);

  const copyCommand = useCallback(async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(`${CONNECT_COMMAND_PREFIX} ${token}`);
      toast.success('Comando copiado!');
    } catch {
      toast.error('Não foi possível copiar o comando.');
    }
  }, [token]);

  return {
    isConnected: connections.length > 0,
    isLoadingStatus,
    connections,
    token,
    expiresAt,
    secondsRemaining,
    isGenerating,
    isDisconnecting,
    botUsername: TELEGRAM_BOT_USERNAME,
    generateToken,
    disconnect,
    disconnectSpecific,
    copyToken,
    copyCommand,
  };
}
