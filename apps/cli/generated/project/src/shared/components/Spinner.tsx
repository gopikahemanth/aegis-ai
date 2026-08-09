import React from 'react';

export interface SpinnerProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Spinner: React.FC<any> = ({ size = 'md', label }) => {
  const dim = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className="flex items-center justify-center space-x-3 p-4">
      <div className={`${dim} border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin`}></div>
      {label && <span className="text-sm text-slate-400 font-medium">{label}</span>}
    </div>
  );
};

export default Spinner;
