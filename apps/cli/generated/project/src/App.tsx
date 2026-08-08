import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Spinner } from './shared/components/Spinner';

const Dashboard = React.lazy(() => import('./features/dashboard/DashboardPage'));
const Auth = React.lazy(() => import('./features/auth/AuthPage'));

export default function App(props: any) {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner /></div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
export { App };
