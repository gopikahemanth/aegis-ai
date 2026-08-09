import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const DashboardPage: React.FC<any> = () => {
  const { data: scans, isLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: () => fetch('/api/scans').then(res => res.json())
  });

  if (isLoading) return <div className="p-8 text-center">Loading Scans...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Resume Scan Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scans?.map((scan: any) => (
          <div key={scan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg">{scan.fileName}</h3>
            <div className="w-24 h-24 mx-auto my-4">
              <CircularProgressbar value={scan.matchScore} text={`${scan.matchScore}%`} />
            </div>
            <div className="text-sm text-slate-600">
              <p>Matched: {scan.matchedKeywords.length} skills</p>
              <p>Missing: {scan.missingKeywords.length} skills</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
export { DashboardPage };
