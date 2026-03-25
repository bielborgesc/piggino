import { useState, useEffect, useCallback } from 'react';
import { getUserSettings } from '../services/api';
import { UserSettings } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  is503020Enabled: false,
  isTitheModuleEnabled: false,
  isTelegramConnected: false,
};

interface UseUserSettingsReturn {
  settings: UserSettings;
  isLoading: boolean;
  refresh: () => void;
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserSettings();
      setSettings(data);
    } catch {
      // Keep default settings on failure — do not crash the UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, isLoading, refresh: fetchSettings };
}
