import React, { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { downloadReport } from '../services/exportService';

interface ExportButtonProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  scanId: number;
}

export const ExportButton: React.FC<any> = ({ scanId }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv') => {
    setLoading(true);
    try {
      await downloadReport(scanId, format);
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="secondary" 
        onClick={() => handleExport('pdf')}
        disabled={loading}
        aria-label="Export as PDF"
      >
        {loading ? 'Exporting...' : 'Export PDF'}
      </Button>
      <Button 
        variant="secondary" 
        onClick={() => handleExport('csv')}
        disabled={loading}
        aria-label="Export as CSV"
      >
        Export CSV
      </Button>
    </div>
  );
};
export default ExportButton;

export type { ExportButtonProps };
