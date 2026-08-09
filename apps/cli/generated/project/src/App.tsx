import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './shared/components/Layout';
import { Spinner } from './shared/components/Spinner';

const Dashboard = React.lazy(() => import('./features/dashboard/DashboardPage'));
const NewScan = React.lazy(() => import('./features/scan/NewScanPage'));

const queryClient = new QueryClient();

export default function App(props: any) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan/new" element={<NewScan />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export { App };
