import React from 'react';
import Navbar from './Navbar';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
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
