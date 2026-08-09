import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stopwords = new Set(['and', 'the', 'to', 'a', 'of', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with']);

const extractKeywords = (text: string): string[] => {
  const words = text.toLowerCase().replace(/[^a-z0-9\+\#\.]/g, ' ').split(/\s+/);
  return Array.from(new Set(words.filter(w => w.length > 2 && !stopwords.has(w))));
};

export const processScan = async (req: Request, res: Response) => {
  try {
    const { jobDescription, resumeText, userId, resumeId } = req.body;
    
    const resumeKeywords = extractKeywords(resumeText);
    const jobKeywords = extractKeywords(jobDescription);

    const matchedKeywords = jobKeywords.filter(kw => resumeKeywords.includes(kw));
    const missingKeywords = jobKeywords.filter(kw => !resumeKeywords.includes(kw));
    const matchScore = jobKeywords.length > 0 
      ? Math.round((matchedKeywords.length / jobKeywords.length) * 100) 
      : 0;

    const result = await prisma.analysisResult.create({
      data: {
        userId: parseInt(userId),
        resumeId: parseInt(resumeId),
        matchScore,
        matchedKeywords,
        missingKeywords,
      }
    });

    res.status(201).json(result);
  } catch (error) {
    res.json([]);
  }
};