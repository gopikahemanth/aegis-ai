import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const handlePdfUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const data = await pdfParse(req.file.buffer);
    return res.status(200).json({ 
      text: data.text.replace(/\s+/g, ' ').trim(),
      filename: req.file.originalname 
    });
  } catch (error) {
    return res.json([]);
  }
};