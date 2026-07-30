import { useState, useCallback } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';

export function useMetrics() {
  const [stats, setStats] = useState(() => AnalyticsService.getStats());

  const refreshStats = useCallback(() => {
    setStats(AnalyticsService.getStats());
  }, []);

  const recordSession = useCallback((minutes: number) => {
    AnalyticsService.recordFocusSession(minutes);
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    recordSession
  };
}