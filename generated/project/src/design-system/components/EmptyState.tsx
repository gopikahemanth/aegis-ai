import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 text-blue-400">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-mono font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};