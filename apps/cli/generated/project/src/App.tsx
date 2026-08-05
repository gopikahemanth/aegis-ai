import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './features/theme-engine/context/ThemeContext';
import { MainLayout } from './shared/components/Layout/MainLayout';
import { Spinner } from './shared/components/UI/Spinner';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';

// Lazy loaded pages using correct directory structure
const HomePage = lazy(() => import('./features/gallery/pages/HomePage'));
const AdminPage = lazy(() => import('./features/admin/pages/AdminPage'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<Spinner size="lg" />}>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </MainLayout>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;