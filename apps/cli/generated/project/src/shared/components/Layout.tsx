import React from 'react';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC<any> = () => (
  <div className="min-h-screen bg-slate-50">
    <nav className="sticky top-0 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between z-10">
      <h1 className="text-xl font-bold text-indigo-600">ResumeScan</h1>
      <div className="flex gap-4">
        <a href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Dashboard</a>
        <a href="/history" className="text-sm font-medium text-slate-600 hover:text-indigo-600">History</a>
      </div>
    </nav>
    <main className="p-8 max-w-6xl mx-auto">
      <Outlet />
    </main>
  </div>
);
export default Layout;
