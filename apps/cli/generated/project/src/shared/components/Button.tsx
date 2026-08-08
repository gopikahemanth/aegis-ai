import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export const Button: React.FC<any> = ({ children, isLoading, disabled, ...props }) => {
  return (
    <button 
      {...props} 
      disabled={disabled || isLoading}
      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
    >
      {isLoading ? 'Processing...' : children}
    </button>
  );
};
export default Button;

export type { ButtonProps };
