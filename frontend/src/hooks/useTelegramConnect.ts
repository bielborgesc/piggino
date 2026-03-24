import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { generateBotLinkToken, disconnectTelegram, getUserSettings } from '../services/api';
import { extractErrorMessage } from '../utils/errors';

const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'PigginoBot';
const CONNECT_COMMAND_PREFIX = '/conectar';

interface UseTelegramConnectResult {
  isConnected: boolean;
  isLoadingStatus: boolean;
  token: string | null;
  expiresAt: Date | null;
  secondsRemaining: number;
  isGenerating: boolean;
  isDisconnecting: boolean;
  botUsername: string;
  generateToken: () => Promise<void>;
  disconnect: () => Promise<void>;
  copyToken: () => Promise<void>;
  copyCommand: () => Promise<void>;
}

export function useTelegramConnect(): UseTelegramConnectResult {
  const [isConnected, setIsConnected] = useState(false);
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
    getUserSettings()
      .then((settings) => setIsConnected(settings.isTelegramConnected))
      .catch(() => {
        toast.error('Nao foi possivel verificar o status do Telegram.');
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
      toast.error(extractErrorMessage(error, 'Erro ao gerar codigo de conexao.'));
    } finally {
      setIsGenerating(false);
    }
  }, [startCountdown]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnectTelegram();
      setIsConnected(false);
      setToken(null);
      setExpiresAt(null);
      stopCountdown();
      toast.success('Telegram desconectado com sucesso.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao desconectar o Telegram.'));
    } finally {
      setIsDisconnecting(false);
    }
  }, [stopCountdown]);

  const copyToken = useCallback(async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Codigo copiado!');
    } catch {
      toast.error('Nao foi possivel copiar o codigo.');
    }
  }, [token]);

  const copyCommand = useCallback(async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(`${CONNECT_COMMAND_PREFIX} ${token}`);
      toast.success('Comando copiado!');
    } catch {
      toast.error('Nao foi possivel copiar o comando.');
    }
  }, [token]);

  return {
    isConnected,
    isLoadingStatus,
    token,
    expiresAt,
    secondsRemaining,
    isGenerating,
    isDisconnecting,
    botUsername: TELEGRAM_BOT_USERNAME,
    generateToken,
    disconnect,
    copyToken,
    copyCommand,
  };
}
