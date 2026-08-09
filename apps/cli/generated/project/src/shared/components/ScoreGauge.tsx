import React from 'react';

interface ScoreGaugeProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
}

export const ScoreGauge: React.FC<any> = ({ score }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <svg className="w-36 h-36 transform -rotate-90">
        <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="10" className="text-slate-100" fill="transparent" />
        <circle 
          cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="10" 
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" className={`transition-all duration-1000 ${getColor(score)}`} fill="transparent"
        />
      </svg>
      <div className="mt-4 text-center">
        <span className={`text-3xl font-bold ${getColor(score)}`}>{score}%</span>
        <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Match Score</p>
      </div>
    </div>
  );
};
export default ScoreGauge;

export type { ScoreGaugeProps };
