import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/design-system';

export const SpendingChart = ({ data }: { data: any[] }) => {
  const chartData = useMemo(() => data.map(item => ({
    name: item.category.name,
    amount: item.amount
  })), [data]);

  return (
    <div className="h-[300px] w-full rounded-md border p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="name" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip cursor={{ fill: 'transparent' }} />
          <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};