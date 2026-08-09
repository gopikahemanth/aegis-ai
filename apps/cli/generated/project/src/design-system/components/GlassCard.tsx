import React from 'react';

export const GlassCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-md p-6 ${className}`} {...props}>
    {children}
  </div>
);
