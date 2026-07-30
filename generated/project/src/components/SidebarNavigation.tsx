import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  Receipt, 
  Layers, 
  ShieldAlert, 
  Settings, 
  ShieldCheck,
  TrendingUp,
  HelpCircle
} from 'lucide-react';

export const SidebarNavigation: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Portfolio & Wealth', path: '/portfolio', icon: Wallet },
    { label: 'Analytics & Reports', path: '/analytics', icon: PieChart },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Asset Allocation', path: '/allocation', icon: Layers },
    { label: 'Risk Assessment', path: '/risk', icon: ShieldAlert },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-40 select-none hidden lg:flex">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-black text-slate-100 tracking-wide text-lg flex items-center gap-1.5">
            AEGIS <span className="text-indigo-400 font-bold text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">PRO</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Enterprise Wealth Terminal</p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Main Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'}
              `}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Live Market Ticker Card */}
      <div className="p-4 mx-4 mb-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            S&P 500 Index
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" /> +0.84%
          </span>
        </div>
        <div className="text-lg font-mono font-extrabold text-slate-100">4,952.18 USD</div>
        <div className="text-[10px] text-slate-500 mt-1">Real-time New York Feed</div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
            AX
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-slate-200 truncate">Alex Mercer</div>
            <div className="text-[10px] text-indigo-400 truncate font-mono">alex@aegiswealth.io</div>
          </div>
        </div>
      </div>
    </aside>
  );
};