import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useAnalysis = () => {
  return useMutation({
    mutationFn: async (data: { resumeText: string; jdText: string; userId: number }) => {
      const { data: response } = await axios.post('/api/scan/analyze', data);
      return response;
    }
  });
};
const _hookDef_useAnalysis = (globalThis as any).useAnalysis || (typeof useAnalysis !== 'undefined' ? useAnalysis : (() => ({})));
export default _hookDef_useAnalysis;
