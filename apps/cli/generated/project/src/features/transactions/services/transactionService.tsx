import { apiClient } from '@/services/apiClient';
import { Transaction } from '../types/transactionTypes';

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data } = await apiClient.get('/transactions');
  return data;
};

export const createTransaction = async (data: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const response = await apiClient.post('/transactions', data);
  return response.data;
};