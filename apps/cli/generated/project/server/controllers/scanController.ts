import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { calculateResumeMatch } from '../utils/matchEngine';

export async function processResumeAnalysis(req: Request, res: Response) {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res.status(400).json({ error: 'Missing file or job description' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;
    
    // Simple mock-up of keyword extraction from JD - in prod use NLP/compromise
    const jobKeywords = req.body.jobDescription.split(' ').filter((w: string) => w.length > 5);
    
    const analysis = calculateResumeMatch(resumeText, jobKeywords);

    // Save to DB via Prisma
    const scan = await prisma.resumeScan.create({
      data: {
        userId: (req as any).user.id,
        jobDescription: req.body.jobDescription,
        resumeText,
        matchScore: analysis.matchScore,
        matchResult: {
          create: {
            matchedKeywords: analysis.matchedKeywords,
            missingKeywords: analysis.missingKeywords
          }
        }
      }
    });

    res.status(200).json(scan);
  } catch (error) {
    res.json([]);
  }
}