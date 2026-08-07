import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export const useTransactions = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (newTx: any) => api.post('/transactions', newTx),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  return { 
    transactions: data, 
    isLoading, 
    error: error as Error | null, 
    createTransaction: mutation.mutate 
  };
};