import React from 'react';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <nav className="border-b border-slate-800 bg-slate-900/70 backdrop-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">A</div>
          <span className="text-lg font-bold tracking-tight text-white">Aegis Scanner</span>
        </div>
        <div className="flex space-x-6 text-sm font-medium text-slate-300">
          <a href="/" className="hover:text-indigo-400 transition-colors">Overview</a>
          <a href="/analyze" className="hover:text-indigo-400 transition-colors">Scan Resume</a>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        AEGIS Resume Keyword Scanner System — PostgreSQL + Prisma Engine
      </footer>
    </div>
  );
};

export default Layout;
