import React from 'react';
import { DeckMetrics } from '../../../entities/flashcard';
import { Layers, FileText, Award, TrendingUp } from 'lucide-react';

interface DashboardMetricsProps {
  metrics: DeckMetrics;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics }) => {
  const items = [
    {
      label: 'Total Decks',
      value: metrics.totalDecks,
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      change: 'Active collections'
    },
    {
      label: 'Flashcards',
      value: metrics.totalCards,
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
      change: 'Indexed concepts'
    },
    {
      label: 'Quizzes Completed',
      value: metrics.quizzesCompleted,
      icon: <Award className="w-5 h-5 text-indigo-400" />,
      change: 'Study sessions'
    },
    {
      label: 'Average Score',
      value: `${metrics.averageScore}%`,
      icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
      change: 'Knowledge retention'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-md p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">{item.label}</span>
            <div className="p-2 rounded-md bg-slate-800/80 border border-slate-700/50">
              {item.icon}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{item.value}</div>
            <div className="text-xs text-slate-500 mt-1">{item.change}</div>
          </div>
        </div>
      ))}
    </div>
  );
};