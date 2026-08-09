import React from 'react';

export const Skeleton: React.FC<any> = ({ className }) => (
  <div className={`animate-pulse bg-slate-800 rounded ${className}`} />
);
export default Skeleton;
