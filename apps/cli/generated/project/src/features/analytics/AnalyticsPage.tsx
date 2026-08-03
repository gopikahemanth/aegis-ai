import React, { useEffect, useState } from 'react';
import { TrendingUp, BarChart2, PieChart as PieIcon, Dumbbell } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Skeleton, EmptyState, Button } from '../../design-system/index';
import { fetchAnalyticsData } from './services/analyticsService';
import { AnalyticsData } from '../../entities/fitness';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAnalyticsData();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-28 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-md" />
          <Skeleton className="h-80 rounded-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-900 rounded-md p-6 text-center max-w-xl mx-auto">
        <p className="text-red-400 font-medium mb-4">{error}</p>
        <Button variant="primary" onClick={loadAnalytics}>Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-md shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Performance Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Deep-dive insights into your muscle distribution and lifting volume.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-md">
          <Dumbbell className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">{data.workoutsCount} Total Workouts Logged</span>
        </div>
      </div>

      {data.workoutsCount === 0 ? (
        <EmptyState
          icon={<BarChart2 className="w-12 h-12" />}
          title="No analytics data available"
          description="Complete and log your workout sessions to generate progressive analytics charts."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Muscle Group Distribution Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-md p-6 shadow-md flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-slate-100">Muscle Group Volume Distribution</h3>
            </div>
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.muscleDistribution}
                    dataKey="volume"
                    nameKey="muscleGroup"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                    label={(props: any) => `${props.muscleGroup ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {data.muscleDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '6px', color: '#f8fafc' }}
                    formatter={(val: any) => [`${Number(val ?? 0).toLocaleString()} kg`, 'Volume']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workout Volume Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-md p-6 shadow-md flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">Workout Volume History (kg)</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.workouts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '6px', color: '#f8fafc' }}
                    formatter={(val: any) => [`${Number(val ?? 0).toLocaleString()} kg`, 'Total Volume']}
                  />
                  <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;