import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={[
        'animate-pulse bg-slate-800/60 rounded-md',
        className,
      ].join(' ')}
    />
  );
};