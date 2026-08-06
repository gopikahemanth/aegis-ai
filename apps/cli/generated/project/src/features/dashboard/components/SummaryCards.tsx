import React from 'react';
import { Card } from '../../../shared/components/Card';

interface SummaryProps {
  totalBalance: number;
  monthlyExpenses: number;
}

export const SummaryCards: React.FC<any> = ({ totalBalance, monthlyExpenses }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Total Balance" value={`$${totalBalance.toLocaleString()}`} />
      <Card title="Monthly Expenses" value={`$${monthlyExpenses.toLocaleString()}`} variant="warning" />
    </div>
  );
};