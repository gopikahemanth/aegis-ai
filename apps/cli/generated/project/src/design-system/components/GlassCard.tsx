import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-md p-6 ${className}`} {...props}>
    {children}
  </div>
);

export default GlassCard;