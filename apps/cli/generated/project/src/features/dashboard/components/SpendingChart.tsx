import React from 'react';

interface SpendingChartProps {
  data: any;
}

export default function SpendingChart({ data }: SpendingChartProps) {
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
      <h3 className="text-lg font-semibold text-white mb-4">Monthly Spending</h3>
      {/* Chart implementation would go here */}
      <pre className="text-slate-400">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}