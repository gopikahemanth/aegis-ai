import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const parseResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume provided' });
    
    const data = await pdfParse(req.file.buffer);
    const text = data.text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    res.json({ text, fileName: req.file.originalname });
  } catch (error) {
    res.json([]);
  }
};