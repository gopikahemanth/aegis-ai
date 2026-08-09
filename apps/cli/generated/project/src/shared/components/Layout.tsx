import React from 'react';

export const Layout: React.FC<any> = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <nav className="h-16 border-b border-neutral-200 bg-white px-8 flex items-center justify-between">
        <span className="font-bold text-xl tracking-tight text-indigo-600">ResuMatch-AI</span>
      </nav>
      <main className="max-w-6xl mx-auto p-8">
        {children}
      </main>
    </div>
  );
};
export default Layout;
