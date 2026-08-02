import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-md p-12 text-center flex flex-col items-center justify-center space-y-4">
      <div className="p-4 bg-slate-800/80 text-slate-400 rounded-md">
        {icon}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};