import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * GlassCard component providing a standardized backdrop-blurred container.
 * Adheres to the 8px grid system and global design tokens.
 */
export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-md p-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;