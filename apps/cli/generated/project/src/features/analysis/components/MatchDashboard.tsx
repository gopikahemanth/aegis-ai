import React, { useMemo } from 'react';
import { MatchScoreDial } from '../../../shared/components/MatchScoreDial';

interface MatchDashboardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
  skills: string[];
}

export const MatchDashboard: React.FC<any> = ({ score, skills }) => {
  const status = useMemo(() => {
    if (score > 75) return 'Excellent Match';
    if (score > 50) return 'Potential Match';
    return 'Weak Match';
  }, [score]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      <MatchScoreDial score={score} />
      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
        <h2 className="text-xl font-bold mb-4">Analysis Summary</h2>
        <p className="text-zinc-400">Status: {status}</p>
        <ul className="mt-4 space-y-2">
          {skills.map((skill) => (
            <li key={skill} className="text-sm text-zinc-300">✓ {skill}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default MatchDashboard;

export type { MatchDashboardProps };
