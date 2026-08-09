import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume PDF required' });
    const { jobDescription, jobTitle } = req.body;
    
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // Simple keyword extraction logic
    const keywords = jobDescription.toLowerCase().split(/\W+/).filter((w: string) => w.length > 4);
    const uniqueKeywords = [...new Set(keywords)];
    
    const matched = uniqueKeywords.filter(k => resumeText.includes(k));
    const missing = uniqueKeywords.filter(k => !resumeText.includes(k));
    const score = Math.round((matched.length / (uniqueKeywords.length || 1)) * 100);

    const scan = await prisma.resumeScan.create({
      data: {
        userId: (req as any).user.id,
        jobTitle,
        matchScore: score,
        matchedKeywords: matched as string[],
        missingSkills: missing as string[],
        rawTextSnippet: resumeText.substring(0, 200)
      }
    });

    res.json(scan);
  } catch (error) {
    res.json([]);
  }
};