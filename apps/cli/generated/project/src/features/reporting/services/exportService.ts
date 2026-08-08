export const downloadReport = async (scanId: number, format: 'pdf' | 'csv') => {
  const response = await fetch(`/api/reports/${scanId}/${format}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });

  if (!response.ok) throw new Error('Export failed');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resume-analysis-${scanId}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
