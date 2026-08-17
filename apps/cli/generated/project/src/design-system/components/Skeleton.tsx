import React from 'react';

interface SkeletonProps {
  [key: string]: any;
  scans?: any;
  history?: any;
  data?: any;
  className?: string;
  lines?: number;
  count?: number;
  height?: string | number;
  width?: string | number;
}

export const Skeleton: React.FC<any> = ({ className = '', lines = 1, count }) => {
  const effectiveLines = count ?? lines;
  if (effectiveLines > 1) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading">
        {Array.from({ length: effectiveLines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 rounded-md bg-slate-800 animate-pulse ${i === effectiveLines - 1 ? 'w-3/4' : 'w-full'} ${className}`}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`rounded-md bg-slate-800 animate-pulse ${className}`}
    />
  );
};

export default Skeleton;

export type { SkeletonProps };
