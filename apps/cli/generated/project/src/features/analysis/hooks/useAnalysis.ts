import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useAnalyzeResume = () => {
  return useMutation({
    mutationFn: async (data: { resumeText: string; jobDescription: string }) => {
      const { data: response } = await axios.post('/api/analyze', data);
      return response;
    },
  });
};