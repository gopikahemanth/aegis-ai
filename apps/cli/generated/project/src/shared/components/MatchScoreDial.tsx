import React from 'react';

export interface MatchScoreDialProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
  size?: number;
  label?: string;
}

export const MatchScoreDial: React.FC<any> = ({
  score = 0,
  size = 120,
  label = "Match Score"
}) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const colorClass =
    normalizedScore >= 75 ? "text-emerald-400" :
    normalizedScore >= 50 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/80 rounded-xl border border-slate-800">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colorClass}`}>${Math.round(normalizedScore)}%</span>
        </div>
      </div>
      {label && <span className="mt-2 text-xs text-slate-400 font-medium">{label}</span>}
    </div>
  );
};

export default MatchScoreDial;
