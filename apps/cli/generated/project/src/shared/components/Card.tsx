import React from 'react';

interface CardProps {
  [key: string]: any;
  scans?: any;
  history?: any;
  data?: any;
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<any> = ({ children, className = '' }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-lg p-6 ${className}`}>
    {children}
  </div>
);
export default Card;

export type { CardProps };
