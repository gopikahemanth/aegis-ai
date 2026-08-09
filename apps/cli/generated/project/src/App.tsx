import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './shared/components/Navbar';

const Dashboard = lazy(() => import('./features/dashboard/DashboardPage'));
const History = lazy(() => import('./features/history/HistoryPage'));

const queryClient = new QueryClient();

export default function App(props: any) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <Suspense fallback={<div className="animate-pulse h-64 bg-slate-200 rounded-xl" />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export { App };
