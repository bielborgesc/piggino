import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthTokens, TokenPayload } from '../types';
import { getAccessToken, getRefreshToken, storeTokens, clearTokens, logoutUser } from '../services/api';

interface UseAuthReturn {
  isAuthenticated: boolean;
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

function hasValidSession(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) return false;

  // The interceptor will handle silent refresh on 401.
  // On app load we only force logout if there is no refresh token
  // or if the access token is expired and there is no refresh token to fall back on.
  // Since we only store a refresh token when it is valid, its mere presence is
  // enough to allow the app to load — the interceptor will do the rest.
  return !isAccessTokenExpired(accessToken) || refreshToken.length > 0;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasValidSession);

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

  return { isAuthenticated, onLoginSuccess, onLogout };
}
