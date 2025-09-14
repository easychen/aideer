import { useState, useEffect } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme-mode';

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // 从localStorage读取保存的主题设置
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved as ThemeMode) || 'system';
  });

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    
    // 清理之前的系统主题监听
    if ((window as any).__themeCleanup) {
      (window as any).__themeCleanup();
      delete (window as any).__themeCleanup;
    }
    
    if (mode === 'system') {
      // 跟随系统主题
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const updateSystemTheme = () => {
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      // 立即应用当前系统主题
      updateSystemTheme();
      
      // 监听系统主题变化
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // 存储清理函数
      (window as any).__themeCleanup = () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    } else {
      // 手动设置主题
      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // 保存到localStorage
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode);
  };

  // 初始化主题
  useEffect(() => {
    applyTheme(themeMode);
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if ((window as any).__themeCleanup) {
        (window as any).__themeCleanup();
        delete (window as any).__themeCleanup;
      }
    };
  }, []);

  return {
    themeMode,
    setTheme,
  };
};

export type { ThemeMode };