import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text' }) => {
  const baseClasses = 'animate-pulse bg-slate-800/80';
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'h-32 w-full rounded-xl',
    circle: 'h-10 w-10 rounded-full',
  };

  return <div className={[baseClasses, variantClasses[variant], className].join(' ')} />;
};