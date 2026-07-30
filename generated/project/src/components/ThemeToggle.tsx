import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-slate-800/80 transition-all duration-300 shadow-md cursor-pointer"
    >
      {theme === 'dark' ? <Sun size={20} className="text-amber-400 animate-spin-slow" /> : <Moon size={20} className="text-indigo-600" />}
    </button>
  );
};