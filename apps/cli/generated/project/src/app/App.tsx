import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('@/features/dashboard/DashboardPage'));
const Transactions = lazy(() => import('@/features/transactions/TransactionsPage'));

export const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
