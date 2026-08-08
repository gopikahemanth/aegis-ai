import React from 'react';

export function useAuth({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export default useAuth;
