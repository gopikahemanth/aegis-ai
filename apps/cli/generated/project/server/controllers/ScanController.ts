import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import pdfParse from 'pdf-parse';

const prisma = new PrismaClient();

export const createScan = async (req: Request, res: Response) => {
  try {
    const { jobTitle, jobDescription } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Resume file required' });

    const parsed = await pdfParse(file.buffer);
    const resumeText = parsed.text;

    // Simplified NLP logic for backend persistence
    const jobWords = jobDescription.toLowerCase().split(/\s+/);
    const resumeWords = new Set(resumeText.toLowerCase().split(/\s+/));
    const matches = jobWords.filter((w: string) => resumeWords.has(w));
    const score = Math.round((matches.length / (jobWords.length || 1)) * 100);

    const session = await prisma.scanSession.create({
      data: {
        userId: (req as any).user.id,
        jobTitle,
        jobDescription,
        resumeText,
        matchScore: score,
      }
    });

    res.status(201).json(session);
  } catch (error) {
    res.json([]);
  }
};