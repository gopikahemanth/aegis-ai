import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import { MatchDashboard } from "./features/analysis/components/MatchDashboard";

export function AppRoutes(props: any) {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-indigo-400">AEGIS</span>
            <span className="text-sm text-slate-400">Resume Keyword Scanner</span>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <Link to="/" className="hover:text-indigo-400 transition-colors">Dashboard</Link>
            <Link to="/analyze" className="hover:text-indigo-400 transition-colors">Analyze Resume</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/analyze" element={<MatchDashboard score={85} skills={["React", "TypeScript", "Express", "PostgreSQL"]} />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default AppRoutes;
