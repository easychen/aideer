import { useState } from 'react';

interface ApiSettings {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
}

interface AppSettings {
  api: ApiSettings;
}

const SETTINGS_STORAGE_KEY = 'app-settings';

const defaultSettings: AppSettings = {
  api: {
    apiKey: '',
    apiBaseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo'
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 合并默认设置和保存的设置，确保所有字段都存在
        return {
          ...defaultSettings,
          ...parsed,
          api: {
            ...defaultSettings.api,
            ...parsed.api
          }
        };
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
    return defaultSettings;
  });

  const updateApiSettings = (apiSettings: Partial<ApiSettings>) => {
    const newSettings = {
      ...settings,
      api: {
        ...settings.api,
        ...apiSettings
      }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const saveSettings = (settingsToSave: AppSettings) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  };

  return {
    settings,
    updateApiSettings,
    resetSettings,
    saveSettings: () => saveSettings(settings)
  };
};

export type { ApiSettings, AppSettings };