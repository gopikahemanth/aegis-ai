import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC<any> = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="h-16 border-b border-slate-200 bg-white flex items-center px-8 shadow-sm">
        <div className="container mx-auto flex items-center">
          <span className="font-bold text-xl text-indigo-600">AegisScanner</span>
        </div>
      </nav>
      <main className="container mx-auto py-8">
        <Suspense fallback={<div className="animate-pulse h-64 bg-slate-200 rounded-xl" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};
export default Layout;
