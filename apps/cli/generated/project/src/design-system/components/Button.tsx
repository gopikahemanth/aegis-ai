import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | string;
export type ButtonSize = 'sm' | 'md' | 'lg' | string;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: any;
  size?: any;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: any;
}

const variantClasses: Record<string, string> = {
  primary:   'bg-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-500 shadow-sm',
  secondary: 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 focus-visible:ring-zinc-600',
  ghost:     'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 focus-visible:ring-zinc-600',
  danger:    'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500 shadow-sm',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export const Button: React.FC<any> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && icon && <span aria-hidden="true">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};

export default Button;
