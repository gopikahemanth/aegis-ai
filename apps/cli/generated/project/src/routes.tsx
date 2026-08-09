import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import UploadPage from "./features/upload/UploadPage";
import LoginPage from "./features/auth/LoginPage";
import MatchDashboard from "./features/analysis/components/MatchDashboard";

export function AppRoutes(props: any) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/analysis" element={<MatchDashboard />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
