import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<any> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
};
const _compDef_Card: any = (props: any) => <div className="card-shim" {...props}>{props?.children}</div>;
export default _compDef_Card;
