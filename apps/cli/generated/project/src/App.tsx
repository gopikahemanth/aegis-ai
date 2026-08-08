import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/shared/components/Navbar';

const DashboardPage = React.lazy(() => import('./features/dashboard/DashboardPage'));
const UploadPage = React.lazy(() => import('./features/upload/UploadPage'));

export const App: React.FC<any> = () => (
  <BrowserRouter>
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  </BrowserRouter>
);

export default App;
