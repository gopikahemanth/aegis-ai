import React from 'react';
import { User } from '../../../entities/User';
import { Card, Button, Badge } from '../../../design-system';

interface DashboardOverviewProps {
  user: User;
  stats: {
    streakDays: number;
    studyPlansCount: number;
    flashcardsReviewed: number;
    quizzesCompleted: number;
    overallProgress: number;
  };
  onNavigate: (path: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user, stats, onNavigate }) => {
  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900/80 to-slate-900 border border-indigo-500/20 rounded-2xl shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              🔥 {stats.streakDays} Day Study Streak
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Welcome back, {user.name || 'Scholar'}!</h1>
          <p className="text-sm text-slate-400">Ready to conquer your curricula and level up your knowledge today?</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={() => onNavigate('/app/ai-chat')}>
            🤖 Ask AI Tutor
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('/app/study-plans')}>
            + New Study Plan
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Study Plans</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-100">{stats.studyPlansCount}</span>
            <Badge variant="info">Curricula</Badge>
          </div>
          <button
            onClick={() => onNavigate('/app/study-plans')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium text-left mt-2 cursor-pointer"
          >
            View all plans →
          </button>
        </Card>

        <Card className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flashcards Reviewed</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-100">{stats.flashcardsReviewed}</span>
            <Badge variant="success">Spaced Rep</Badge>
          </div>
          <button
            onClick={() => onNavigate('/app/flashcards')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium text-left mt-2 cursor-pointer"
          >
            Review decks →
          </button>
        </Card>

        <Card className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quizzes Completed</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-100">{stats.quizzesCompleted}</span>
            <Badge variant="warning">Tested</Badge>
          </div>
          <button
            onClick={() => onNavigate('/app/quizzes')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium text-left mt-2 cursor-pointer"
          >
            Take practice test →
          </button>
        </Card>

        <Card className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-100">{stats.overallProgress}%</span>
            <Badge variant="info">Milestones</Badge>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Quick Access Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">AI Study Tools</h3>
            <span className="text-xs text-slate-400">Powered by RAG & LLMs</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('/app/ai-chat')}
              className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left transition-all cursor-pointer group"
            >
              <span className="text-xl">📄</span>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300">Document RAG Chat</span>
              <span className="text-xs text-slate-400">Upload PDFs and chat with your notes instantly</span>
            </button>
            <button
              onClick={() => onNavigate('/app/flashcards')}
              className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left transition-all cursor-pointer group"
            >
              <span className="text-xl">⚡</span>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300">Spaced Flashcards</span>
              <span className="text-xs text-slate-400">Algorithm-driven memory retention</span>
            </button>
            <button
              onClick={() => onNavigate('/app/quizzes')}
              className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left transition-all cursor-pointer group"
            >
              <span className="text-xl">📝</span>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300">AI Quiz Generator</span>
              <span className="text-xs text-slate-400">Custom tests with detailed explanations</span>
            </button>
            <button
              onClick={() => onNavigate('/app/study-plans')}
              className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left transition-all cursor-pointer group"
            >
              <span className="text-xl">🎯</span>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300">Personalized Curricula</span>
              <span className="text-xs text-slate-400">Structured roadmaps mapped to your goals</span>
            </button>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">Study Tips & Insights</h3>
            <Badge variant="success">AI Advice</Badge>
          </div>
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-indigo-400">Active Recall Technique</span>
              <p className="text-sm text-slate-300">Testing yourself with AI flashcards builds stronger neural pathways than passive re-reading.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-indigo-400">Spaced Repetition Schedule</span>
              <p className="text-sm text-slate-300">Review difficult flashcards after 1 day, then 3 days, then 7 days to maximize long-term retention.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};