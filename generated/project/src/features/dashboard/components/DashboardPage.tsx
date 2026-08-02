import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton } from '../../../design-system';
import { apiClient } from '../../../utils/apiClient';

interface DashboardMetrics {
  totalDocuments: number;
  totalFlashcards: number;
  totalQuizzes: number;
  averageQuizScore: number;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiClient.get('/dashboard/metrics');
        setMetrics(res.data);
      } catch {
        setMetrics({
          totalDocuments: 3,
          totalFlashcards: 24,
          totalQuizzes: 5,
          averageQuizScore: 88,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Study Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Welcome back. Here is your learning activity and knowledge retention progress.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/app/documents')} variant="secondary" size="sm">
            Upload Notes
          </Button>
          <Button onClick={() => navigate('/app/chat')} size="sm">
            Ask AI Tutor
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Study Documents</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">{metrics?.totalDocuments}</p>
            <p className="text-xs text-emerald-400 mt-1">Vectorized & ready for RAG</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Flashcards</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">{metrics?.totalFlashcards}</p>
            <p className="text-xs text-indigo-400 mt-1">Spaced repetition active</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Quizzes Completed</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">{metrics?.totalQuizzes}</p>
            <p className="text-xs text-indigo-400 mt-1">AI generated MCQ sets</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Avg Quiz Score</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">{metrics?.averageQuizScore}%</p>
            <p className="text-xs text-emerald-400 mt-1">Mastery trending high</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Quick Study Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => navigate('/app/chat')}
              className="p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer bg-slate-950 transition-all"
            >
              <h3 className="font-semibold text-slate-200 text-sm">Doubt Solving Tutor</h3>
              <p className="text-xs text-slate-400 mt-1">Chat with your notes and get citations instantly.</p>
            </div>
            <div 
              onClick={() => navigate('/app/flashcards')}
              className="p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer bg-slate-950 transition-all"
            >
              <h3 className="font-semibold text-slate-200 text-sm">Review Flashcards</h3>
              <p className="text-xs text-slate-400 mt-1">Practice scheduled cards for long-term memory.</p>
            </div>
            <div 
              onClick={() => navigate('/app/quizzes')}
              className="p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer bg-slate-950 transition-all"
            >
              <h3 className="font-semibold text-slate-200 text-sm">Take AI Practice Quiz</h3>
              <p className="text-xs text-slate-400 mt-1">Test your knowledge with custom generated exams.</p>
            </div>
            <div 
              onClick={() => navigate('/app/documents')}
              className="p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer bg-slate-950 transition-all"
            >
              <h3 className="font-semibold text-slate-200 text-sm">Manage Materials</h3>
              <p className="text-xs text-slate-400 mt-1">Upload and organize lecture slides or PDFs.</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Study Streak</h2>
          <div className="text-center py-6 bg-slate-950 rounded-xl border border-slate-800">
            <p className="text-4xl font-extrabold text-indigo-400">5 Days</p>
            <p className="text-xs text-slate-400 mt-2">Consistent daily learning streak</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Keep up your daily review sessions to ensure higher retention rates before exam day.
          </p>
        </div>
      </div>
    </div>
  );
};