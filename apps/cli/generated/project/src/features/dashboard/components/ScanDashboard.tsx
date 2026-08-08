import React, { useState } from 'react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';

export const ScanDashboard: React.FC<any> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!file || !jd) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jd);

    try {
      const response = await fetch('/api/scan', { method: 'POST', body: formData });
      const data = await response.json();
      console.log('Result:', data);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto space-y-4">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <textarea 
        className="w-full border p-2 rounded" 
        placeholder="Paste Job Description..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />
      <Button onClick={handleScan} isLoading={loading}>Analyze Resume</Button>
    </Card>
  );
};
export default ScanDashboard;
