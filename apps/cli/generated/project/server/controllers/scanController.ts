import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'Missing resume or job description' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // Simple Keyword Scorer (MVP Logic)
    const jobKeywords = jobDescription.toLowerCase().match(/\b(\w+)\b/g) || [];
    const uniqueKeywords = [...new Set(jobKeywords)];
    const matched = uniqueKeywords.filter(k => resumeText.includes(k));
    const score = Math.round((matched.length / uniqueKeywords.length) * 100);

    const scan = await prisma.scanResult.create({
      data: {
        userId: (req as any).user.id,
        jobTitle: "Analysis Result",
        matchScore: score,
        keywordCoverage: { matched, total: uniqueKeywords.length }
      }
    });

    res.status(200).json(scan);
  } catch (error) {
    res.json([]);
  }
};