import React from 'react';

interface EmptyStateProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  title: string;
  message: string;
  cta: string;
  onAction: () => void;
}

export const EmptyState: React.FC<any> = ({ title, message, cta, onAction }) => (
  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
    <div className="text-center space-y-4 max-w-sm">
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
      <button 
        onClick={onAction}
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {cta}
      </button>
    </div>
  </div>
);
export default EmptyState;

export type { EmptyStateProps };
