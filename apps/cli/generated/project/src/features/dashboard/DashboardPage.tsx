import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, Flame, Dumbbell, ArrowRight, TrendingUp } from 'lucide-react';
import { Button, Skeleton, EmptyState } from '../../design-system/index';
import { DashboardStats } from '../../entities/fitness';
import { fetchDashboardStats } from './services/dashboardService';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-32 rounded-md" />
        </div>
        <Skeleton className="h-64 rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-900 rounded-md p-6 text-center">
        <p className="text-red-400 font-medium mb-4">{error}</p>
        <Button variant="primary" onClick={loadData}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const maxVolume = Math.max(...stats.chartData.map((d) => Math.max(d.volumeKg, d.targetKg)), 1000);

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Quick Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Welcome back, Athlete</h1>
          <p className="text-sm text-slate-400 mt-1">Ready to crush your goals today? Jump straight into your active workout.</p>
        </div>
        <Link to="/logger">
          <Button variant="primary" size="lg" icon={<Play className="w-5 h-5 text-white" />}>
            Start Workout
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-md p-5 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-md bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Workouts</p>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">{stats.totalWorkouts}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-5 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-md bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Volume Lifted</p>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">{stats.totalVolumeAllTime.toLocaleString()} kg</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-5 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-md bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Current Streak</p>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">{stats.currentStreak} Active</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-5 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-md bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Personal Records</p>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">{stats.prCount}</p>
          </div>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-6 text-slate-100 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Weekly Volume Progress</h3>
            <p className="text-sm text-slate-400">Total lifted weight (kg) per day vs target</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-blue-600 inline-block" /> Actual</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-slate-800 inline-block" /> Target</span>
          </div>
        </div>

        <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-slate-800">
          {stats.chartData.map((item, index) => {
            const actualHeight = Math.min((item.volumeKg / maxVolume) * 100, 100);
            const targetHeight = Math.min((item.targetKg / maxVolume) * 100, 100);

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex justify-center items-end gap-1 h-full relative">
                  <div
                    style={{ height: `${targetHeight}%` }}
                    className="w-3 bg-slate-800 rounded-md transition-all duration-300 group-hover:bg-slate-700"
                  />
                  <div
                    style={{ height: `${actualHeight}%` }}
                    className="w-3 bg-gradient-to-t from-blue-700 to-blue-500 rounded-md transition-all duration-500 shadow-lg shadow-blue-950/50"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-400 transition-colors">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-100">Recent Workout Logs</h3>
          <Link to="/history" className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentWorkouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="w-10 h-10" />}
            title="No workouts completed yet"
            description="Start your first workout session to track your strength journey."
            action={
              <Link to="/logger">
                <Button variant="primary">Start Workout Now</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {stats.recentWorkouts.map((workout) => (
              <div key={workout.id} className="bg-slate-950 border border-slate-800 rounded-md p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-200">{workout.workoutName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(workout.startTime).toLocaleDateString()} • {workout.sets.length} sets logged</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-400">{workout.totalVolume.toLocaleString()} kg</span>
                  <p className="text-xs text-slate-500">Volume</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;