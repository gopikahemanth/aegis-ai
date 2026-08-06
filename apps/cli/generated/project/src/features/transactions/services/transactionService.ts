import { apiClient } from '../../../services/apiClient';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
}

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data } = await apiClient.get('/transactions');
  return data;
};

export const postTransaction = async (data: Omit<Transaction, 'id' | 'date'>) => {
  return await apiClient.post('/transactions', data);
};