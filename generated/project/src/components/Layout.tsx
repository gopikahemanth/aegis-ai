import React, { useState } from 'react';
import { 
  Compass, 
  Rocket, 
  Activity, 
  Globe2, 
  Calculator, 
  Settings, 
  Menu, 
  X, 
  Radio, 
  Bell, 
  ShieldAlert, 
  Search,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentRoute, onNavigate, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Command Overview', icon: Compass },
    { path: '/missions', label: 'Active Missions', icon: Rocket },
    { path: '/telemetry', label: 'Telemetry & Diagnostics', icon: Activity },
    { path: '/starmap', label: 'Star Map & Weather', icon: Globe2 },
    { path: '/calculator', label: 'Orbital Calculator', icon: Calculator },
    { path: '/settings', label: 'Subsystem Settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans selection:bg-nebula-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 backdrop-blur-xl bg-space-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('/')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-nebula-600 to-stellar-400 flex items-center justify-center shadow-lg shadow-stellar-500/30 glow-cyan">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white bg-gradient-to-r from-white via-slate-200 to-stellar-400 bg-clip-text text-transparent">
                AETHERIS
              </span>
              <span className="block text-[10px] font-mono text-stellar-400 tracking-widest uppercase">Deep Space Command</span>
            </div>
          </div>

          {/* Quick Header Status Pill */}
          <div className="hidden md:flex items-center space-x-4 px-4 py-1.5 rounded-full bg-space-900/80 border border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">QUANTUM LINK: <strong className="text-emerald-400">100%</strong></span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-stellar-400" />
              <span className="text-slate-300">SOLAR ARRAY: <strong className="text-stellar-400">NOMINAL</strong></span>
            </div>
          </div>

          {/* Actions & Notifications */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl bg-space-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-stellar-400"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel border border-slate-700 p-4 shadow-2xl z-50 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white uppercase tracking-wider">Subspace Broadcasts</span>
                    <span className="text-[10px] text-stellar-400">3 Unread</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800 space-y-1">
                      <div className="flex justify-between text-[10px] text-stellar-400">
                        <span>SOLAR WEATHER</span>
                        <span>14:22</span>
                      </div>
                      <p className="text-slate-300 font-sans">CME wave warning cleared for Helios sector.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800 space-y-1">
                      <div className="flex justify-between text-[10px] text-emerald-400">
                        <span>PROPULSION</span>
                        <span>13:50</span>
                      </div>
                      <p className="text-slate-300 font-sans">Titan Outpost Alpha reached orbital insertion velocity.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-space-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-2">
          <div className="glass-panel p-4 rounded-3xl space-y-1.5 border border-slate-800/80 sticky top-24">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">Navigation Matrix</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-nebula-600/30 to-stellar-500/20 text-white border border-stellar-500/40 shadow-lg shadow-stellar-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-900/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-stellar-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-800/80 px-3">
              <div className="p-3 rounded-2xl bg-space-900/90 border border-slate-800/80 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>SECTOR:</span>
                  <span className="text-white">01-ALPHA</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>NODE:</span>
                  <span className="text-stellar-400">SECURE</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-2">
                  <div className="bg-gradient-to-r from-stellar-500 to-nebula-500 h-full rounded-full w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-space-950/90 backdrop-blur-xl lg:hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="font-bold text-white tracking-widest uppercase font-mono">Navigation Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-base font-medium transition-all ${
                      isActive
                        ? 'bg-stellar-500/20 text-white border border-stellar-500/40'
                        : 'text-slate-400 hover:text-white bg-space-900/60'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-stellar-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-space-950/90 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>AETHERIS COMMAND PROTOCOL v4.8.2-STABLE</span>
          <span className="text-stellar-400">INTERSTELLAR COMMUNICATIONS ENCRYPTED</span>
          <span>© 2142 Starfleet Research Corp</span>
        </div>
      </footer>
    </div>
  );
};