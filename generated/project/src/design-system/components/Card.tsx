import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glass = true, ...props }) => {
  return (
    <div
      className={[
        glass
          ? 'bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-xl shadow-indigo-500/5'
          : 'bg-slate-900 border border-slate-800 shadow-md',
        'rounded-xl p-6 transition-all duration-200',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
};