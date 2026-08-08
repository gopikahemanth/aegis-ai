import React from 'react';

export function LoginPage({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export default LoginPage;
