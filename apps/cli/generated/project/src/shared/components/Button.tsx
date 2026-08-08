import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export const Button = ({ variant = 'primary', className = '', ...props }: ButtonProps) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    ghost: "text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-400"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${className}`} 
      {...props} 
    />
  );
};
export default Button;
