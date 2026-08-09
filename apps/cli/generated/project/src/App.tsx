import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const queryClient = new QueryClient();

export const App: React.FC<any> = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
