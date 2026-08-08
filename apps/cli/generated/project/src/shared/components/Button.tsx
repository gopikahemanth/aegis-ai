import React from 'react';
import { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-4 py-2 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:ring-indigo-500",
          variant === 'primary' ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300",
          className
        )}
        {...props}
      />
    );
  }
);
export default Button;

export type { ClassValue };

export type { ButtonProps };
