import React from "react";

export function Navbar(props: any) {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          AEGIS AI
        </span>
      </div>
    </nav>
  );
}

export default Navbar;