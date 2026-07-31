import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  onOpenModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onOpenModal }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 cursor-pointer shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <i className="fa-solid fa-shield-halved text-white text-lg"></i>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-mono">AEGIS<span className="text-cyan-400">.AI</span></span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-slate-300">
          <button onClick={() => handleNavClick('features')} className="hover:text-cyan-400 transition-colors cursor-pointer bg-transparent border-none">Features</button>
          <button onClick={() => handleNavClick('architecture')} className="hover:text-cyan-400 transition-colors cursor-pointer bg-transparent border-none">Architecture</button>
          <button onClick={() => handleNavClick('terminal')} className="hover:text-cyan-400 transition-colors cursor-pointer bg-transparent border-none">Live Demo</button>
          <button onClick={() => handleNavClick('metrics')} className="hover:text-cyan-400 transition-colors cursor-pointer bg-transparent border-none">Telemetry</button>
          <Link to="/docs" className="hover:text-cyan-400 transition-colors">Documentation</Link>
          <Link to="/playground" className="hover:text-cyan-400 transition-colors">Playground</Link>
          <Link to="/enterprise" className="hover:text-cyan-400 transition-colors">Enterprise</Link>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={onOpenModal} className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-800 hover:text-white transition-all cursor-pointer">
            Sign In
          </button>
          <button onClick={() => handleNavClick('terminal')} className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer">
            Deploy Agent
          </button>
        </div>
      </div>
    </header>
  );
};