import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('../../features/dashboard/DashboardPage'));
const Upload = lazy(() => import('../../features/parser/UploadPage'));

export const AppRoutes = () => (
  <Suspense fallback={<div className="p-8">Loading Application...</div>}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/upload" element={<Upload />} />
    </Routes>
  </Suspense>
);
export default AppRoutes;
