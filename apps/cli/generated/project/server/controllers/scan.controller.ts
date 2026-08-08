import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'Missing file or job description' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    const keywords = jobDescription.toLowerCase().match(/\b(\w+)\b/g) || [];
    const uniqueKeywords = Array.from(new Set(keywords.filter(k => k.length > 3)));
    
    const matched = uniqueKeywords.filter(k => resumeText.includes(k));
    const missing = uniqueKeywords.filter(k => !resumeText.includes(k));
    const score = Math.round((matched.length / uniqueKeywords.length) * 100);

    const result = await prisma.scanResult.create({
      data: {
        userId: (req as any).user.id,
        jobDescription,
        matchScore: score,
        matchedSkills: matched,
        missingSkills: missing
      }
    });

    res.json(result);
  } catch (error) {
    res.json([]);
  }
};