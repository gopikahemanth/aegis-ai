import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * GlassCard component providing a consistent glassmorphic effect.
 * Uses Tailwind CSS backdrop-blur and semi-transparent backgrounds.
 */
export const GlassCard: React.FC<any> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <div 
    className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-lg p-6 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

export default GlassCard;