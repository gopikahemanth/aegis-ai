import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useScanHistory = () => {
  return useQuery({
    queryKey: ['scan-history'],
    queryFn: async () => {
      const { data } = await api.get('/api/scans');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
const _hookDef_useScanHistory = (globalThis as any).useScanHistory || (typeof useScanHistory !== 'undefined' ? useScanHistory : (() => ({})));
export default _hookDef_useScanHistory;
