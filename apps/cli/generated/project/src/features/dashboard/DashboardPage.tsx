import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../shared/components/Card';
import { Button } from '../../design-system/components/Button';
import { api } from '../../services/api';

export default function DashboardPage() {
  const { data: scans, isLoading } = useQuery(['resumeScans'], () => api.get('/history').then(res => res.data));

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resume Scans</h1>
          <p className="text-slate-500">Track your application match scores</p>
        </div>
        <Button onClick={() => window.location.href = '/upload'}>New Scan</Button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          {scans?.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">No scans found. Upload your first resume to begin.</Card>
          ) : (
            scans?.map((scan: any) => (
              <Card key={scan.id} className="flex justify-between items-center p-6">
                <div>
                  <h3 className="font-semibold">{scan.jobTitle}</h3>
                  <p className="text-sm text-slate-500">Match Score: {scan.matchScore}%</p>
                </div>
                <Button variant="secondary">View Report</Button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}