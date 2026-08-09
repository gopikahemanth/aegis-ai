import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const DashboardPage = lazy(() => import('../../features/dashboard/DashboardPage'));
const UploadPage = lazy(() => import('../../features/uploader/UploadPage'));

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
export default AppRouter;
