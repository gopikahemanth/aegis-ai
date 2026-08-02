import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-xl p-6 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};