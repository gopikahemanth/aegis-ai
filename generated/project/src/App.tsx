import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

const LoginPage = lazy(() => import('./features/auth/components/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./features/auth/components/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./features/dashboard/components/DashboardPage').then(m => ({ default: m.DashboardPage })));
const DocumentsPage = lazy(() => import('./features/documents/components/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const DocumentViewerPage = lazy(() => import('./features/documents/components/DocumentViewerPage').then(m => ({ default: m.DocumentViewerPage })));
const ChatPage = lazy(() => import('./features/chat/components/ChatPage').then(m => ({ default: m.ChatPage })));
const FlashcardsPage = lazy(() => import('./features/flashcards/components/FlashcardsPage').then(m => ({ default: m.FlashcardsPage })));
const FlashcardReviewPage = lazy(() => import('./features/flashcards/components/FlashcardReviewPage').then(m => ({ default: m.FlashcardReviewPage })));
const QuizzesPage = lazy(() => import('./features/quizzes/components/QuizzesPage').then(m => ({ default: m.QuizzesPage })));
const QuizTakerPage = lazy(() => import('./features/quizzes/components/QuizTakerPage').then(m => ({ default: m.QuizTakerPage })));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Aegis AI...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/app" element={<Layout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<DocumentViewerPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="flashcards/:deckId" element={<FlashcardReviewPage />} />
            <Route path="quizzes" element={<QuizzesPage />} />
            <Route path="quizzes/:quizId" element={<QuizTakerPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;