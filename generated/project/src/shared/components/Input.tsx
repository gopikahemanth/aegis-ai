import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...props }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-slate-950 border text-slate-100 placeholder-slate-500 rounded-md px-3.5 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-800 hover:border-slate-700'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400" role="alert">{error}</span>}
    </div>
  );
};