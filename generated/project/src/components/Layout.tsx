import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/app/dashboard' },
    { label: 'Study Materials', path: '/app/documents' },
    { label: 'AI Tutor Chat', path: '/app/chat' },
    { label: 'Flashcards', path: '/app/flashcards' },
    { label: 'Practice Quizzes', path: '/app/quizzes' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              A
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-100">Aegis AI</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    active
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80">
          <button
            onClick={() => {
              localStorage.removeItem('aegis_token');
              navigate('/auth/login');
            }}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};