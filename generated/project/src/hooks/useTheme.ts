import { useLocalStorage } from './useLocalStorage';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<'dark' | 'midnight'>('theme', 'dark');
  return { theme, setTheme };
}