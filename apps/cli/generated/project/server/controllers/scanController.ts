import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file || !req.body.jobDescription) {
      res.status(400).json({ error: 'Missing resume file or job description' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    const jobDescription = req.body.jobDescription.toLowerCase();

    // Keyword Extraction Logic
    const keywords = jobDescription.split(/\W+/).filter((w: string) => w.length > 3);
    const uniqueKeywords = Array.from(new Set(keywords));
    
    const matched = uniqueKeywords.filter(kw => resumeText.includes(kw));
    const score = Math.round((matched.length / uniqueKeywords.length) * 100);

    const scan = await prisma.resumeScan.create({
      data: {
        userId: (req as any).user.id,
        matchScore: score,
        matchedKeywords: matched,
        missingKeywords: uniqueKeywords.filter(kw => !matched.includes(kw)),
      }
    });

    res.json(scan);
  } catch (error) {
    res.json([]);
  }
};