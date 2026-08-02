import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Skeleton } from './design-system/index.js';

const DashboardPage = lazy(() => import('./features/dashboard/components/DashboardPage.js'));
const EditorPage = lazy(() => import('./features/editor/components/EditorPage.js'));
const QuizPage = lazy(() => import('./features/quiz/components/QuizPage.js'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-950 p-6 md:p-10 flex items-center justify-center">
    <div className="space-y-4 max-w-md w-full">
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/decks/new" element={<EditorPage />} />
          <Route path="/decks/:id/edit" element={<EditorPage />} />
          <Route path="/decks/:id/quiz" element={<QuizPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;