import React, { useMemo } from 'react';

interface Props {
  score: number;
}

export const MatchScoreGauge: React.FC<any> = ({ score }) => {
  const colorClass = useMemo(() => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  }, [score]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className={`text-5xl font-bold ${colorClass}`}>
        {score}%
      </div>
      <p className="text-sm text-slate-500 mt-2 font-medium">Match Score</p>
    </div>
  );
};
export default MatchScoreGauge;

export type { Props };
