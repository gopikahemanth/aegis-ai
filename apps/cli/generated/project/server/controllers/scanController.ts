import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Resume file required' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resume = await prisma.resume.create({
      data: {
        userId: (req as any).user.id,
        originalName: req.file.originalname,
        rawText: pdfData.text,
        s3Key: `resumes/${Date.now()}-${req.file.originalname}`
      }
    });

    res.status(201).json({ success: true, resumeId: resume.id });
  } catch (error) {
    res.json([]);
  }
};