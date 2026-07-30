import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Alex Morgan
          </span>
          <p className="text-xs text-slate-500 mt-1">
            Principal Software Engineer & Systems Architect. Built with precision and React & Tailwind.
          </p>
        </div>

        <div className="flex items-center space-x-6 text-sm text-slate-400">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">GitHub</a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">LinkedIn</a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Twitter</a>
          <a href="mailto:alex@example.com" className="hover:text-indigo-400 transition-colors">Email</a>
        </div>

        <div className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Alex Morgan. All rights reserved.
        </div>
      </div>
    </footer>
  );
};