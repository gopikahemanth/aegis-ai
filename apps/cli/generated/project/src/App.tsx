import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));

export default function App(props: any) {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading Application...</div>}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
export { App };
