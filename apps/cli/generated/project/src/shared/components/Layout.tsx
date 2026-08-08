import React, { Suspense } from 'react';
import { Navbar } from './Navbar';

export const AppLayout: React.FC<any> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<div className="animate-pulse h-96 bg-slate-800 rounded-2xl" />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
};
const _shim_Layout: any = (props: any) => <div className="layout-shim" {...props}>{props?.children}</div>;
export { _shim_Layout as Layout };

export default _shim_Layout;
