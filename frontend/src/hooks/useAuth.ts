import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthTokens, TokenPayload } from '../types';
import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
  logoutUser,
  refreshAccessToken,
} from '../services/api';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isInitializing: boolean;
  onLoginSuccess: (tokens: AuthTokens) => void;
  onLogout: () => Promise<void>;
}

function isAccessTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<TokenPayload & { exp: number }>(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return decoded.exp <= nowInSeconds;
  } catch {
    return true;
  }
}

function sessionNeedsProactiveRefresh(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) return false;

  return isAccessTokenExpired(accessToken);
}

function hasValidSession(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) return false;

  return !isAccessTokenExpired(accessToken) || refreshToken.length > 0;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasValidSession);
  const [isInitializing, setIsInitializing] = useState<boolean>(sessionNeedsProactiveRefresh);

  const onLoginSuccess = useCallback((tokens: AuthTokens): void => {
    storeTokens(tokens);
    setIsAuthenticated(true);
  }, []);

  const onLogout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } catch {
      // Logout best-effort: clear local state regardless of server response.
    } finally {
      clearTokens();
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = (): void => {
      setIsAuthenticated(false);
    };

    window.addEventListener('piggino:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('piggino:auth-expired', handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    if (!isInitializing) return;

    const proactivelyRefreshToken = async (): Promise<void> => {
      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        clearTokens();
        setIsAuthenticated(false);
        setIsInitializing(false);
        return;
      }

      try {
        const tokens = await refreshAccessToken({ refreshToken: storedRefreshToken });
        storeTokens(tokens);
      } catch {
        clearTokens();
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    proactivelyRefreshToken();
  }, [isInitializing]);

  return { isAuthenticated, isInitializing, onLoginSuccess, onLogout };
}
