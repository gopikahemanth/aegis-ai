import React from 'react';

export const DashboardLayout: React.FC<any> = ({ children }) => (
  <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
    <header className="flex items-center justify-between mb-12">
      <h1 className="text-2xl font-bold tracking-tight text-white">ResumeScan</h1>
      <nav className="flex gap-4">
        <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</a>
        <a href="/history" className="text-sm text-zinc-400 hover:text-white transition-colors">History</a>
      </nav>
    </header>
    <main className="max-w-7xl mx-auto">
      {children}
    </main>
  </div>
);
export default DashboardLayout;
