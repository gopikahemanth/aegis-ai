const onSubmit = (data: any) => console.log(data);
import React, { useState } from 'react';
import { Button } from '../../../design-system/components/Button';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const AnalysisForm = () => {
  const [files, setFiles] = useState<{ resume: File | null; jd: File | null }>({ resume: null, jd: null });

  const mutation = useMutation({
    mutationFn: (data: FormData) => axios.post('/api/scan/analyze', data)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.resume || !files.jd) return;
    
    const formData = new FormData();
    formData.append('resume', files.resume);
    formData.append('jd', files.jd);
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-zinc-800 rounded-lg">
      <input type="file" onChange={(e) => setFiles(prev => ({...prev, resume: e.target.files![0]}))} />
      <input type="file" onChange={(e) => setFiles(prev => ({...prev, jd: e.target.files![0]}))} />
      <Button type="submit" loading={mutation.isPending}>Analyze Match</Button>
    </form>
  );
};
export default AnalysisForm;
