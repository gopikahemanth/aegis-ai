import React from 'react';
import { MatchScoreGauge } from '../../../shared/components/MatchScoreGauge';

interface Props {
  matchScore: number;
  matchedCount: number;
  missingCount: number;
}

export const MatchOverview: React.FC<any> = ({ matchScore, matchedCount, missingCount }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 flex items-center justify-center">
      <MatchScoreGauge score={matchScore} />
    </div>
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
      <h3 className="text-zinc-400 text-sm font-medium">Matched Keywords</h3>
      <p className="text-3xl font-bold mt-2 text-emerald-500">{matchedCount}</p>
    </div>
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
      <h3 className="text-zinc-400 text-sm font-medium">Missing Skills</h3>
      <p className="text-3xl font-bold mt-2 text-rose-500">{missingCount}</p>
    </div>
  </div>
);
export default MatchOverview;

export type { Props };
