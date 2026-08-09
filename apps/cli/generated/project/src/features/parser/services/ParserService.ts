import axios from 'axios';

export const ParserService = {
  async parseResume(file: File): Promise<{ text: string; filename: string }> {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await axios.post('/api/parser/parse-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    if (!response.data.success) throw new Error('Parsing failed');
    return { text: response.data.text, filename: response.data.filename };
  }
};
export default ParserService;

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
