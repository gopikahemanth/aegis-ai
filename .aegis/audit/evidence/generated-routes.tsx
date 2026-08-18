import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
const AnalyzePage = lazy(() => import("./features/analyzer/AnalyzePage"));
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const HistoryPage = lazy(() => import("./features/history/HistoryPage"));
const RulesPage = lazy(() => import("./features/rules/RulesPage"));

export function AppRoutes(props: any) {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">Loading...</div>}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analyzer" element={<AnalyzePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/rules" element={<RulesPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export const routes = AppRoutes;
export default AppRoutes;
