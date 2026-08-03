import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './shared/components/Navbar';
import { Skeleton } from './design-system/index';

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const ActiveWorkoutPage = lazy(() => import('./features/logger/ActiveWorkoutPage'));
const ExerciseLibraryPage = lazy(() => import('./features/exercises/ExerciseLibraryPage'));
const WorkoutHistoryPage = lazy(() => import('./features/history/WorkoutHistoryPage'));
const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage'));

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense
            fallback={
              <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-40 rounded-md" />
                  <Skeleton className="h-40 rounded-md" />
                  <Skeleton className="h-40 rounded-md" />
                </div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/logger" element={<ActiveWorkoutPage />} />
              <Route path="/exercises" element={<ExerciseLibraryPage />} />
              <Route path="/history" element={<WorkoutHistoryPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;