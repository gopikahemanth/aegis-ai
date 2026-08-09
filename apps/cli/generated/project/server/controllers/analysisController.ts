import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { jobDescription, jobTitle } = req.body;
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'Resume and Job Description required' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // Extract potential keywords (simple word tokenizer for demo purposes)
    const jobKeywords = jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueJobKeywords = Array.from(new Set(jobKeywords));
    
    const matched: string[] = [];
    const missing: string[] = [];

    uniqueJobKeywords.forEach(word => {
      if (resumeText.includes(word)) matched.push(word);
      else missing.push(word);
    });

    const matchScore = Math.round((matched.length / (uniqueJobKeywords.length || 1)) * 100);

    const scan = await prisma.resumeScan.create({
      data: {
        userId: (req as any).user.id,
        fileName: req.file.originalname,
        jobTitle,
        matchScore,
        matchedKeywords: matched,
        missingSkills: missing
      }
    });

    res.json(scan);
  } catch (error) {
    res.json([]);
  }
};