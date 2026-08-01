import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, History, Info, FileSearch } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight">ATS ScanPro</span>
            <span className="block text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Resume Intelligence</span>
          </div>
        </Link>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link
            to="/"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
              isActive('/')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span className="hidden sm:inline">Scanner</span>
          </Link>

          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
              isActive('/dashboard')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span>Dashboard</span>
          </Link>

          <Link
            to="/history"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
              isActive('/history')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </Link>

          <Link
            to="/about"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
              isActive('/about')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">About</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};