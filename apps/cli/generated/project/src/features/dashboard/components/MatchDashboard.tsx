import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/shared/components/Card';
import { MatchScoreDial } from '@/shared/components/MatchScoreDial';

interface DashboardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
  matchedKeywords: string[];
  missingSkills: string[];
}

export const MatchDashboard: React.FC<any> = ({ score, matchedKeywords, missingSkills }) => {
  const statusColor = useMemo(() => {
    if (score > 75) return 'text-emerald-500';
    if (score > 50) return 'text-amber-500';
    return 'text-rose-500';
  }, [score]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
      <Card className="col-span-1 md:col-span-3 flex items-center justify-between p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Resume Match Analysis</h2>
          <p className="text-slate-400">Deep scan results for your uploaded document</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-4xl font-black ${statusColor}`}>{score}%</span>
          <MatchScoreDial score={score} />
        </div>
      </Card>

      <Card title="Matched Keywords" className="p-6">
        <div className="flex flex-wrap gap-2">
          {matchedKeywords.map((k) => (
            <span key={k} className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              {k}
            </span>
          ))}
        </div>
      </Card>

      <Card title="Skill Gaps" className="p-6">
        <ul className="space-y-2">
          {missingSkills.map((s) => (
            <li key={s} className="text-sm text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {s}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
export default MatchDashboard;

export type { DashboardProps };
