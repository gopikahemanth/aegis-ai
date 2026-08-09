import pdfParse from 'pdf-parse';

export class ParsingService {
  static async extractTextFromBuffer(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('Unable to extract meaningful text from PDF');
      }
      return data.text;
    } catch (error) {
      throw new Error(`Parsing Error: ${(error as Error).message}`);
    }
  }
}
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
