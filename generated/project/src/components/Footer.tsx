import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-mono">AEGIS<span className="text-cyan-400">.AI</span></span>
        </div>
        <div className="text-sm text-slate-500 text-center md:text-left">
          &copy; 2026 Aegis AI Systems Inc. All rights reserved. Autonomous Neural Security.
        </div>
        <div className="flex items-center gap-6 text-slate-400 text-sm">
          <Link to="/docs" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
          <Link to="/docs" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
          <Link to="/docs" className="hover:text-cyan-400 transition-colors">Security Audit</Link>
        </div>
      </div>
    </footer>
  );
};