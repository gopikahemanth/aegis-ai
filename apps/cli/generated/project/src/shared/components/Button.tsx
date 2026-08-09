import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-300 hover:border-indigo-600"
  };

  return (
    <button 
      className={twMerge(base, variants[variant], className)}
      {...props}
    />
  );
}
export default Button;

export type { ClassValue };

export type { ButtonProps };
