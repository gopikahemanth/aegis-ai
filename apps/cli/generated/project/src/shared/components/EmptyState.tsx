import React from 'react';
import { Button } from '@/design-system/components/Button';

interface EmptyStateProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const EmptyState: React.FC<any> = ({ title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800 rounded-lg">
    <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
    <p className="text-slate-400 mb-6 max-w-sm">{description}</p>
    <Button onClick={onAction}>{actionLabel}</Button>
  </div>
);
export default EmptyState;

export type { EmptyStateProps };
