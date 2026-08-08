import React from 'react';

interface ScoreGaugeProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
}

export const ScoreGauge: React.FC<any> = ({ score }) => {
  return (
    <div className="relative flex items-center gap-4">
      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-2xl font-bold text-slate-900 w-16 text-right">{score}%</span>
    </div>
  );
};
export default ScoreGauge;

export type { ScoreGaugeProps };
