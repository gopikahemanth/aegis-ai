import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Dashboard = lazy(() => import('../../features/dashboard/DashboardPage'));
const Transactions = lazy(() => import('../../features/transactions/TransactionsPage'));

export const AppRoutes = () => (
  <Suspense fallback={<div className="p-8">Loading Application...</div>}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);