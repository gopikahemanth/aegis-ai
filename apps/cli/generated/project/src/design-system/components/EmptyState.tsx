import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<any> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && (
      <div className="mb-4 text-slate-600" aria-hidden="true">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 max-w-xs mb-6">{description}</p>
    )}
    {action && <div>{action}</div>}
  </div>
);
