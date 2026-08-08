import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<any> = ({ children, className }) => {
  return (
    <div className={twMerge(
      "bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl",
      className
    )}>
      {children}
    </div>
  );
};
export default GlassCard;

export type { ClassValue };

export type { GlassCardProps };
