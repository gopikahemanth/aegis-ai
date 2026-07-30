import React from 'react';
import { MetricCard } from './MetricCard';
import { useMetrics } from '../hooks/useMetrics';

export const WidgetGrid: React.FC = () => {
  const { stats } = useMetrics();

  const hours = Math.floor(stats.totalFocusMinutes / 60);
  const minutes = stats.totalFocusMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <MetricCard
        title="Completed Tasks"
        value={`${stats.completedTasks} / ${stats.totalTasks}`}
        change={`${stats.completionRate}% Done`}
        isPositive={stats.completionRate >= 50}
        icon="⚡"
      />
      <MetricCard
        title="Focus Time"
        value={timeFormatted}
        change="Productive"
        isPositive={true}
        icon="⏳"
      />
      <MetricCard
        title="Pomodoro Sessions"
        value={stats.totalPomodoros}
        change="Sessions"
        isPositive={true}
        icon="🍅"
      />
      <MetricCard
        title="Completion Rate"
        value={`${stats.completionRate}%`}
        change={stats.completionRate >= 70 ? 'Optimal' : 'Needs Focus'}
        isPositive={stats.completionRate >= 70}
        icon="🎯"
      />
    </div>
  );
};