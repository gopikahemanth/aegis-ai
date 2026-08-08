import React from 'react';

interface CardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  title: string;
  value: string | number;
}

export const Card: React.FC<any> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-sm text-slate-500 font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-2 text-slate-900">{value}</p>
  </div>
);
export default Card;

export type { CardProps };
