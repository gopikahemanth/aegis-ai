import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-indigo-500/10 transition-all duration-300 hover:border-slate-700 ${
        onClick ? 'cursor-pointer hover:translate-y-[-2px]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};