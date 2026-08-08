import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <Card title="Overall Match Score" className="p-6">
        <div className="text-4xl font-bold text-violet-500">{score}%</div>
        <p className="text-zinc-400 mt-2">Semantic relevance to job description</p>
      </Card>

      <Card title="Skill Gap Analysis" className="p-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-2">Matched Skills</h4>
            <div className="flex flex-wrap gap-2">
              {matched.slice(0, 10).map(k => <Badge key={k} variant="success">{k}</Badge>)}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-400 mb-2">Missing Skills</h4>
            <div className="flex flex-wrap gap-2">
              {missing.slice(0, 10).map(k => <Badge key={k} variant="danger">{k}</Badge>)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
export default MatchDashboard;

export type { MatchDashboardProps };
