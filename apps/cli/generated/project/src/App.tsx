import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const GalleryPage = React.lazy(() => import('./pages/GalleryPage'));

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-slate-950" />}>
          <Routes>
            <Route path="/" element={<GalleryPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;