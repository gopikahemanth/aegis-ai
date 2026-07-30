import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storageService.getThemePreference());

  useEffect(() => {
    storageService.setThemePreference(theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}