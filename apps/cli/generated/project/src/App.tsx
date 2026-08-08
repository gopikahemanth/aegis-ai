import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './shared/components/Layout';
import { LoadingSpinner } from './shared/components/LoadingSpinner';

const queryClient = new QueryClient();

const Dashboard = React.lazy(() => import('./features/dashboard/DashboardPage'));
const Upload = React.lazy(() => import('./features/uploader/UploadPage'));

export default function App(props: any) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export { App };
