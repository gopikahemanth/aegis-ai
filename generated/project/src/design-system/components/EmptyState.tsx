import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div className="text-center py-16 px-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl space-y-3">
      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-xl font-bold">
        📂
      </div>
      <h3 className="text-lg font-bold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mx-auto">{description}</p>
    </div>
  );
};