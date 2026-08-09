import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const parseResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Resume file is required.' });
      return;
    }

    if (req.file.mimetype !== 'application/pdf') {
      res.status(400).json({ error: 'Only PDF files are supported.' });
      return;
    }

    const data = await pdfParse(req.file.buffer);
    res.status(200).json({ text: data.text });
  } catch (error) {
    res.json([]);
  }
};