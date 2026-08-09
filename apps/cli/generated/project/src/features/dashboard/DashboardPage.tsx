import React from 'react';
import MatchDashboard from './components/MatchDashboard';

export const DashboardPage: React.FC = () => {
  return (
    <MatchDashboard
      score={85}
      matchedKeywords={['React', 'TypeScript', 'Express', 'PostgreSQL']}
      missingSkills={['Docker', 'GraphQL']}
    />
  );
};

export default DashboardPage;
