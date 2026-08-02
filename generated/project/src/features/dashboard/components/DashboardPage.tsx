import React from 'react';
import { DashboardOverview } from './DashboardOverview';
import { useAuth } from '../../auth/hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { stats } = useDashboardStats(user?.id);

  if (!user) return null;

  return <DashboardOverview user={user} stats={stats} onNavigate={onNavigate} />;
};