import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  loading, 
  children, 
  className = '', 
  ...props 
}) => {
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-slate-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${className} disabled:opacity-50`} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};