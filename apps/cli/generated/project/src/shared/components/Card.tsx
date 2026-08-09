import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<any> = ({ children, className = '' }) => (
  <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-xl p-6 ${className}`}>
    {children}
  </div>
);
export default Card;

export type { CardProps };
