import { apiClient } from '../../../services/apiClient';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  date: string;
}

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data } = await apiClient.get('/transactions');
  return data;
};

export const createTransaction = async (data: Omit<Transaction, 'id'>) => {
  return await apiClient.post('/transactions', data);
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
