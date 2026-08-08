import { useState } from 'react';
import { apiClient } from '../../../services/api';

export const useFileUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadResume = async (file: File) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const { data } = await apiClient.post('/api/scans/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data.extractedText;
    } catch (err) {
      setError('Failed to upload and parse resume.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadResume, loading, error };
};
const _hookDef_useFileUpload = (globalThis as any).useFileUpload || (typeof useFileUpload !== 'undefined' ? useFileUpload : (() => ({})));
export default _hookDef_useFileUpload;
