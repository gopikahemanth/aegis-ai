import React from 'react';

export function AuthContext({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export default AuthContext;
