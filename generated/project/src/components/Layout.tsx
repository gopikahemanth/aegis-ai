import React from 'react';
import { User } from '../entities/User';
import { Button } from '../design-system';

interface LayoutProps {
  user: User;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, currentPath, onNavigate, onLogout, children }) => {
  const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/app/study-plans', label: 'Study Plans', icon: '🎯' },
    { path: '/app/flashcards', label: 'Flashcards', icon: '⚡' },
    { path: '/app/quizzes', label: 'Quizzes', icon: '📝' },
    { path: '/app/ai-chat', label: 'AI Tutor & RAG', icon: '🤖' },
    { path: '/app/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between p-6 shrink-0">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/30">
              🧠
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-slate-100">StudyAssistant</span>
              <span className="text-xs text-slate-400">AI Powered RAG</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map(item => {
              const active = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={[
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left',
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                  ].join(' ')}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
              {user.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-slate-200 truncate">{user.name || 'Scholar'}</span>
              <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onLogout} className="w-full">
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};