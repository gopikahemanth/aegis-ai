import { AnalyticsData } from '../../../entities/fitness';

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const response = await fetch('/api/analytics');
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data');
  }
  return response.json();
}