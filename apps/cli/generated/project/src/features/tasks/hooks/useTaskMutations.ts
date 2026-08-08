import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export const useTaskMutations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; columnId: string; status: string }) => 
      apiClient('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
const _hookDef_useTaskMutations = (globalThis as any).useTaskMutations || (typeof useTaskMutations !== 'undefined' ? useTaskMutations : (() => ({})));
export default _hookDef_useTaskMutations;
