import React from 'react';

interface MetricCardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  label: string;
  value: string | number;
  subtext?: string;
}

export const MetricCard: React.FC<any> = ({ label, value, subtext }) => (
  <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
    <p className="text-sm font-medium text-neutral-500 mb-2">{label}</p>
    <h3 className="text-3xl font-bold tracking-tight text-neutral-900">{value}</h3>
    {subtext && <p className="text-xs text-neutral-400 mt-2">{subtext}</p>}
  </div>
);
export default MetricCard;

export type { MetricCardProps };
