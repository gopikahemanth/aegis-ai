import React from "react";

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  value?: string | number;
  [key: string]: any;
}

export function Card(props: CardProps) {
  const { children, className = "", title, value, ...rest } = props || {};
  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur ${className}`} {...rest}>
      {title && <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>}
      {value && <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>}
      {children}
    </div>
  );
}

export const GlassCard = Card;
export default Card;