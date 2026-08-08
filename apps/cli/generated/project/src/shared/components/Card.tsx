import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<any> = ({ children, className = '' }) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-6 ${className}`}>
    {children}
  </div>
);
export default Card;

export type { CardProps };
