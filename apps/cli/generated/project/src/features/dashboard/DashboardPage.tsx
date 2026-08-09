import React, { useState, Suspense } from 'react';
import { Card } from '../../shared/components/Card';
import { MatchScoreChart } from './components/MatchScoreChart';
import { KeywordPills } from './components/KeywordPills';

const DashboardPage: React.FC<any> = () => {
  const [scanData, setScanData] = useState(null);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Resume Match Analytics</h1>
        <p className="text-slate-500">Monitor your career alignment and ATS optimization.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 p-6">
          <h2 className="text-sm font-medium text-slate-500">Match Score</h2>
          <div className="mt-4 h-48 flex items-center justify-center">
            <MatchScoreChart score={scanData?.matchScore || 0} />
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h2 className="text-sm font-medium text-slate-500 mb-4">Missing Skills</h2>
          <KeywordPills keywords={scanData?.missingKeywords || []} type="missing" />
          <h2 className="text-sm font-medium text-slate-500 mt-8 mb-4">Matched Skills</h2>
          <KeywordPills keywords={scanData?.matchedKeywords || []} type="matched" />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
export { DashboardPage };
