import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Skeleton } from './design-system/index';

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const DeckEditorPage = lazy(() => import('./features/deck-editor/DeckEditorPage').then(m => ({ default: m.DeckEditorPage })));
const QuizPage = lazy(() => import('./features/quiz-mode/QuizPage').then(m => ({ default: m.QuizPage })));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-950 p-10 flex flex-col items-center justify-center space-y-4">
    <div className="text-slate-400 text-sm font-sans animate-pulse">Loading view...</div>
    <div className="w-64 space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/decks/new" element={<DeckEditorPage />} />
        <Route path="/decks/:deckId/edit" element={<DeckEditorPage />} />
        <Route path="/decks/:deckId/quiz" element={<QuizPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </Suspense>
  );
};