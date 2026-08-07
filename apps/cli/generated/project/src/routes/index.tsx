import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load components for performance
const Dashboard = React.lazy(() => import('../features/dashboard/Dashboard'));
const Transactions = React.lazy(() => import('../features/transactions/Transactions'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};