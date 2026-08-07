import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const fetchTransactions = async () => {
  const { data } = await api.get('/transactions');
  return data;
};

export const addTransaction = async (payload: {
  amount: number;
  description: string;
  type: string;
  categoryId: string;
  date: string;
}) => {
  const { data } = await api.post('/transactions', payload);
  return data;
};