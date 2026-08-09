import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

export const parseResume = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'Resume file required' });
    return;
  }

  try {
    const data = await pdfParse(req.file.buffer);
    res.status(200).json({ content: data.text, fileName: req.file.originalname });
  } catch (error) {
    res.json([]);
  }
};