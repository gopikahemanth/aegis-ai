import { useState, useCallback } from 'react';
import { api } from '../../../services/api';

interface MatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
}

export function useResumeMatcher() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  const analyzeResume = useCallback(async (file: File, jobDescription: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const { data } = await (api.post as any)('/api/scan/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(data);
    } catch (err) {
      setError('Failed to analyze document. Please ensure it is a valid PDF.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeResume, loading, error, result };
}
const _hookDef_useResumeMatcher = (globalThis as any).useResumeMatcher || (typeof useResumeMatcher !== 'undefined' ? useResumeMatcher : (() => ({})));
export default _hookDef_useResumeMatcher;

export type { MatchResult };
