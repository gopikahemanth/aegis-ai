import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC<any> = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-8 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">A</div>
          <span className="text-lg font-bold tracking-tight text-white">Aegis Scanner</span>
        </Link>
      </div>
      <div className="flex items-center space-x-6 text-sm font-medium text-slate-300">
        <Link to="/" className="hover:text-indigo-400 transition-colors">Overview</Link>
        <Link to="/upload" className="hover:text-indigo-400 transition-colors">Scan Resume</Link>
        {token ? (
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors">
            Sign Out
          </button>
        ) : (
          <Link to="/login" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
