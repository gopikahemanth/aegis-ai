import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl transition-all duration-300 ${
        glow ? 'shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:border-indigo-500/40' : ''
      } ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`}
    >
      {children}
    </div>
  );
};