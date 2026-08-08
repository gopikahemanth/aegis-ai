import { useState, useEffect } from 'react';
import axios from 'axios';

interface Scan {
  id: string;
  score: number;
  createdAt: string;
}

export const useScanHistory = () => {
  const [data, setData] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/scans');
        setData(response.data);
      } catch (err) {
        setError('Failed to load scan history');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
};
const _hookDef_useScanHistory = (globalThis as any).useScanHistory || (typeof useScanHistory !== 'undefined' ? useScanHistory : (() => ({})));
export default _hookDef_useScanHistory;

export type { Scan };
