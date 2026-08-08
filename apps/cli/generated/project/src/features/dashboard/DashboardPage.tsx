import React from 'react';
import { useScanHistory } from './hooks/useScanHistory';
import { ScoreCircle } from './components/ScoreCircle';
import { Button } from '../../design-system/components/Button';

const DashboardPage = () => {
  const { data, loading, error } = useScanHistory();

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-900 animate-pulse rounded-lg border border-zinc-800" />
        ))}
      </div>
    );
  }

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Resume Overview</h1>
          <p className="text-zinc-400">Track your application match scores.</p>
        </div>
        <Button variant="primary">Upload New Resume</Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h3 className="text-sm text-zinc-400">Total Scans</h3>
          <p className="text-3xl font-bold text-white mt-2">{data.length}</p>
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-6">Recent Results</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.map((scan) => (
            <div key={scan.id} className="flex flex-col items-center bg-zinc-800 p-4 rounded-md">
              <ScoreCircle score={scan.score} />
              <span className="mt-4 text-xs text-zinc-400">
                {new Date(scan.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
export { DashboardPage };
