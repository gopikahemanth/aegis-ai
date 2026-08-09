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
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-indigo-500/50 transition-colors">
    <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-2">{title}</h3>
    <p className="text-3xl font-semibold text-white">{value}</p>
  </div>
);
export default Card;

export type { CardProps };
