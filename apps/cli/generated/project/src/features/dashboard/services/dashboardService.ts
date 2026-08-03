import { DashboardStats } from '../../../entities/fitness';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard analytics');
  }
  return response.json();
}