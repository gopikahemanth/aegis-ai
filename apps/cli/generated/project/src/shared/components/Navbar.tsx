import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Code & Resume Analyzer", path: "/analyze" },
    { label: "Scan History", path: "/history" },
    { label: "Static Rules", path: "/rules" },
    { label: "Sign In", path: "/login" }
  ];

  return (
    <nav className="bg-slate-900/80 border-b border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl shadow-2xl font-sans">
      <Link to="/" className="flex items-center gap-3 no-underline group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
          🛡️
        </div>
        <span className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
          Aegis Security Engine
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || (item.path === "/" && location.pathname === "/dashboard");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all no-underline ${
                isActive
                  ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default Navbar;
