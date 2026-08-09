import React, { ReactNode } from 'react';
import Navbar from './Navbar';

interface PageShellProps {
  children: ReactNode;
  title?: string;
}

export const PageShell: React.FC<any> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          </header>
        )}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {children}
        </section>
      </main>
      <footer className="py-6 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} ResuMatch AI. All rights reserved.
      </footer>
    </div>
  );
};
export default PageShell;

export type { PageShellProps };
