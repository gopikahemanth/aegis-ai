import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Calendar, BarChart3, Play } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/logger', label: 'Workout', icon: <Play className="w-4 h-4 text-emerald-400" /> },
    { to: '/exercises', label: 'Exercises', icon: <Dumbbell className="w-4 h-4" /> },
    { to: '/history', label: 'History', icon: <Calendar className="w-4 h-4" /> },
    { to: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              AF
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-100">Aegis Fitness</span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isActive
                      ? 'bg-slate-800 text-blue-400 border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900',
                  ].join(' ')
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};