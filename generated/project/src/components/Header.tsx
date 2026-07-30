import React from 'react';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white lg:hidden focus:outline-none"
        >
          ☰
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-slate-100">Welcome back, Commander</h1>
          <p className="text-xs text-slate-400">Here is your productivity brief for today.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationCenter />
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-xs">
            JD
          </div>
        </div>
      </div>
    </header>
  );
};