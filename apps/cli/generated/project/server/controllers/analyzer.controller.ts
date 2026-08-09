import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });

    const { keywords, jobDescriptionId } = req.body;
    const parsed = await pdfParse(req.file.buffer);
    
    const keywordArray: string[] = JSON.parse(keywords);
    const resumeText = parsed.text.toLowerCase();
    
    const matched = keywordArray.filter(kw => resumeText.includes(kw.toLowerCase()));
    const missing = keywordArray.filter(kw => !resumeText.includes(kw.toLowerCase()));
    const score = Math.round((matched.length / keywordArray.length) * 100);

    const result = await prisma.scanResult.create({
      data: {
        userId: (req as any).user.id,
        resumeId: req.body.resumeId,
        matchScore: score,
        matchedKeywords: matched,
        missingKeywords: missing
      }
    });

    res.status(200).json(result);
  } catch (error) {
    res.json([]);
  }
};