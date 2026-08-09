import React from 'react';
import { AnimatedMatchScoreGauge } from '../../../shared/components/AnimatedMatchScoreGauge';

interface Props {
  results: {
    matchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  };
}

export const SemanticResultPanel: React.FC<any> = ({ results }) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
    <h2 className="text-xl font-bold mb-6">Analysis Results</h2>
    <div className="flex items-center gap-8">
      <AnimatedMatchScoreGauge score={results.matchScore} />
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 rounded-lg">
          <p className="text-sm text-emerald-700 font-medium">Matched Skills</p>
          <p className="text-2xl font-bold text-emerald-900">{results.matchedKeywords.length}</p>
        </div>
        <div className="p-4 bg-rose-50 rounded-lg">
          <p className="text-sm text-rose-700 font-medium">Missing Skills</p>
          <p className="text-2xl font-bold text-rose-900">{results.missingKeywords.length}</p>
        </div>
      </div>
    </div>
  </div>
);
export default SemanticResultPanel;

export type { Props };
