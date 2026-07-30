import React, { useState, useEffect } from 'react';
import { Code2, Menu, X, Sparkles, Terminal } from 'lucide-react';
import { Button } from './Button';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Projects', path: '/projects' },
    { label: 'Contact', path: '/contact' }
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl shadow-indigo-500/5 py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        <div
          onClick={() => handleLinkClick('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Code2 size={22} />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Alex Rivers
            </span>
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Principal Coder</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-lg">
          {navItems.map((item) => {
            const isActive = currentRoute === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleLinkClick(item.path)}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleLinkClick('/contact')}
          >
            Hire Principal
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 p-6 space-y-4 md:hidden shadow-2xl animate-fadeIn">
          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleLinkClick(item.path)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  currentRoute === item.path
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-800">
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => handleLinkClick('/contact')}
            >
              Hire Principal
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};