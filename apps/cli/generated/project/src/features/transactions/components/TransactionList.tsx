import React from 'react';
import { useTransactions } from '../hooks/useTransactions';
import Spinner from '@/shared/components/Spinner';

export const TransactionList: React.FC = () => {
  const { transactions, isLoading, error } = useTransactions();

  if (isLoading) return <Spinner />;
  if (error) return <div className="text-red-500">Failed to load transactions: {error.message}</div>;
  if (!transactions?.length) return <div>No transactions found.</div>;

  return (
    <div className="flex flex-col gap-4">
      {transactions.map((tx: any) => (
        <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 border rounded-lg flex justify-between">
          <span className="font-medium">{tx.description}</span>
          <span className={tx.amount < 0 ? 'text-red-500' : 'text-emerald-500'}>
            {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};