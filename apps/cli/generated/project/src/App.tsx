import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './shared/components/Navbar';
import { Spinner } from './shared/components/Spinner';

// Lazy loading features
const DashboardPage = React.lazy(() => import('./features/dashboard/DashboardPage'));
const UploadPage = React.lazy(() => import('./features/upload/UploadPage'));
const LoginPage = React.lazy(() => import('./features/auth/LoginPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App(props: any) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense fallback={<div className="flex justify-center mt-20"><Spinner /></div>}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export { App };
