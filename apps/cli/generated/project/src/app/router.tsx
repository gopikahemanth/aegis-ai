import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Dashboard = lazy(() => import('../features/dashboard/DashboardPage'));
const Transactions = lazy(() => import('../features/transactions/TransactionPage'));

export const AppRouter = () => (
  <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);