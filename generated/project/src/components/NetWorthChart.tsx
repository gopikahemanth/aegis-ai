import React, { useState } from 'react';
import { Currency } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, Calendar } from 'lucide-react';

interface NetWorthChartProps {
  currentNetWorth: number;
  currency: Currency;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ currentNetWorth, currency }) => {
  const [timeframe, setTimeframe] = useState<'1M' | '6M' | '1Y' | 'ALL'>('6M');

  // Simulated chart points based on current net worth
  const dataPoints = {
    '1M': [0.92, 0.94, 0.95, 0.98, 1.0],
    '6M': [0.75, 0.81, 0.84, 0.89, 0.94, 1.0],
    '1Y': [0.60, 0.68, 0.72, 0.79, 0.85, 0.92, 0.96, 1.0],
    'ALL': [0.40, 0.52, 0.64, 0.78, 0.90, 1.0]
  }[timeframe];

  const min = Math.min(...dataPoints);
  const max = Math.max(...dataPoints);
  const range = max - min || 1;

  // Generate SVG polygon coordinates
  const width = 700;
  const height = 240;
  const points = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 40) - 20;
    return `${x},${y}`;
  }).join(' ');

  const firstVal = currentNetWorth * dataPoints[0];
  const lastVal = currentNetWorth;
  const gain = lastVal - firstVal;
  const gainPct = (gain / firstVal) * 100;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Net Worth Trajectory</h3>
          <p className="text-xs text-slate-400">Total assets minus liabilities over time</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          {(['1M', '6M', '1Y', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-4">
        <span className="text-3xl font-extrabold text-slate-100 font-mono">
          {formatCurrency(currentNetWorth, currency)}
        </span>
        <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl flex items-center">
          <TrendingUp className="w-3.5 h-3.5 mr-1" />
          +{gainPct.toFixed(2)}% ({formatCurrency(gain, currency)})
        </span>
      </div>

      {/* SVG Line Graph */}
      <div className="relative w-full h-60 mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill="url(#chartGradient)"
          />

          {/* Glow Line */}
          <polyline
            fill="none"
            stroke="#818cf8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          />
        </svg>
      </div>
    </div>
  );
};