import React from 'react';

interface Props {
  children?: React.ReactNode;
  className?: string;
}

export const Container: React.FC<any> = ({ children, className = '' }) => (
  <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);