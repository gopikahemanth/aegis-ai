import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Skeleton } from './design-system';

const LoginPage = lazy(() => import('./features/authentication/components/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./features/authentication/components/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./features/study-plans/components/DashboardPage').then(m => ({ default: m.DashboardPage })));
const DocumentManagerPage = lazy(() => import('./features/document-ingestion/components/DocumentManagerPage').then(m => ({ default: m.DocumentManagerPage })));
const ChatPage = lazy(() => import('./features/rag-chat/components/ChatPage').then(m => ({ default: m.ChatPage })));
const StudyHubPage = lazy(() => import('./features/flashcards-quizzes/components/StudyHubPage').then(m => ({ default: m.StudyHubPage })));
const StudyPlanPage = lazy(() => import('./features/study-plans/components/StudyPlanPage').then(m => ({ default: m.StudyPlanPage })));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
    <Skeleton className="h-64 w-full max-w-xl rounded-md" />
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentManagerPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/study" element={<StudyHubPage />} />
          <Route path="/study-plans" element={<StudyPlanPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;