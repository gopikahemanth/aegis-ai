import React from 'react';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC<any> = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
    <nav className="border-b border-slate-800 p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold tracking-tight">ResuMatch AI</h1>
      <div className="flex gap-4">
        <a href="/dashboard" className="text-sm hover:text-indigo-400 transition-colors">Dashboard</a>
        <a href="/history" className="text-sm hover:text-indigo-400 transition-colors">History</a>
      </div>
    </nav>
    <main className="max-w-7xl mx-auto p-8">
      <Outlet />
    </main>
  </div>
);
export default Layout;
