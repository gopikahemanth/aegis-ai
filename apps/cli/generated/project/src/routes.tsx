import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import AnalyzePage from "./features/analyzer/AnalyzePage";
import HistoryPage from "./features/history/HistoryPage";
import RulesPage from "./features/rules/RulesPage";
import LoginPage from "./features/auth/LoginPage";

export function AppRoutes(props: any) {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/upload" element={<AnalyzePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/scans" element={<HistoryPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<LoginPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export const routes = AppRoutes;
export default AppRoutes;
