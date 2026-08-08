import React, { useMemo } from 'react';
import { Card } from '../../../shared/components/Card';
import { ProgressBar } from '../../../shared/components/ProgressBar';

interface MatchDashboardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
  matched: string[];
  missing: string[];
}

export const MatchDashboard: React.FC<any> = ({ score, matched, missing }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card title="Match Score">
        <div className="flex flex-col gap-4">
          <div className="text-4xl font-bold text-violet-500">{score}%</div>
          <ProgressBar value={score} max={100} />
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card title="Matched Skills">
          <ul className="text-sm text-zinc-400 space-y-1">
            {matched.slice(0, 5).map(k => <li key={k}>✓ {k}</li>)}
          </ul>
        </Card>
        <Card title="Missing Skills">
          <ul className="text-sm text-red-400 space-y-1">
            {missing.slice(0, 5).map(k => <li key={k}>× {k}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
};
export default MatchDashboard;

export type { MatchDashboardProps };
