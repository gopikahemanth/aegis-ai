import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AnalysisRequest {
  jobTitle: string;
  jobDescription: string;
  resumeContent: string;
  keywords: string[];
}

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { jobTitle, jobDescription, resumeContent, keywords }: AnalysisRequest = req.body;

    // Perform keyword intersection analysis
    const resumeLower = resumeContent.toLowerCase();
    const foundKeywords = keywords.filter(kw => resumeLower.includes(kw.toLowerCase()));
    const missingKeywords = keywords.filter(kw => !resumeLower.includes(kw.toLowerCase()));
    
    // Calculate match score
    const matchScore = Math.round((foundKeywords.length / keywords.length) * 100);

    // Save scan to database
    const scan = await prisma.scan.create({
      data: {
        userId,
        jobTitle,
        jobDescription,
        resumeContent,
        matchScore,
        keywordCoverage: foundKeywords,
        missingKeywords: missingKeywords,
        aiInsights: `Your resume covers ${matchScore}% of the required keywords. ${missingKeywords.length > 0 ? 'Consider adding: ' + missingKeywords.slice(0, 3).join(', ') : 'Great job! All keywords found.'}`
      }
    });

    return res.status(201).json(scan);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.json([]);
  }
};
export type { AnalysisRequest };
