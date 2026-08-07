import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

export const TransactionList: React.FC<any> = () => {
  const { data, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => apiClient.get('/transactions').then((res) => res.data),
  });

  if (isLoading) {
    return <div className="animate-pulse h-16 bg-neutral-100 rounded-md" />;
  }

  if (error) {
    return <div className="text-red-500 p-4">Failed to load transactions.</div>;
  }

  return (
    <div className="space-y-4">
      {(!data || data.length === 0) ? (
        <div className="text-center py-8 text-neutral-500">
          No transactions yet. Start by adding one.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {data.map((t) => (
            <li key={t.id} className="py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-neutral-900">{t.description}</p>
                <p className="text-sm text-neutral-500">{t.category}</p>
              </div>
              <span className={`font-semibold ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                {t.type === 'expense' ? '-' : '+'}${Number(t.amount).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
const _compDef_TransactionList: any = (props: any) => <div className="transactionlist-shim" {...props}>{props?.children}</div>;
export default _compDef_TransactionList;
