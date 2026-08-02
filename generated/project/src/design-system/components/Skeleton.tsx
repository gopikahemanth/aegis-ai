import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'w-full h-6' }) => {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800/80 ${className}`} />
  );
};