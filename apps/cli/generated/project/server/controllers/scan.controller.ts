import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

export async function parseResumeAndCalculateMatch(req: Request, res: Response) {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res.status(400).json({ error: 'Resume file and Job Description required' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    const jobDescription = String(req.body.jobDescription).toLowerCase();

    // Heuristic keyword extraction (simplified for production logic flow)
    const candidates = jobDescription.split(/\W+/).filter(w => w.length > 3);
    const uniqueKeywords = Array.from(new Set(candidates));
    
    const matched = uniqueKeywords.filter(kw => resumeText.includes(kw));
    const missing = uniqueKeywords.filter(kw => !resumeText.includes(kw));
    const score = Math.round((matched.length / uniqueKeywords.length) * 100);

    const scan = await prisma.resumeScan.create({
      data: {
        userId: (req as any).user.id,
        jobTitle: req.body.jobTitle || 'Untitled Role',
        matchScore: score,
        matchedKeywords: matched,
        missingKeywords: missing
      }
    });

    res.json(scan);
  } catch (error) {
    res.json([]);
  }
}