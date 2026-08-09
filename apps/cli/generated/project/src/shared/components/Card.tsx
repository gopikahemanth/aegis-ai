import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<any> = ({ children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>
    {children}
  </div>
);
export default Card;

export type { CardProps };
