import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import ResumeScan from '../models/ResumeScan';

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Resume file required.' });
      return;
    }

    const { jobDescription } = req.body;
    const pdfData = await pdfParse(req.file.buffer);
    
    // Logic: Simple Keyword Extraction & Comparison
    const resumeText = pdfData.text.toLowerCase();
    const jdKeywords = jobDescription.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
    
    const matched = jdKeywords.filter((word: string) => resumeText.includes(word));
    const missing = jdKeywords.filter((word: string) => !resumeText.includes(word));
    const score = Math.round((matched.length / (jdKeywords.length || 1)) * 100);

    const scan = await ResumeScan.create({
      userId: (req as any).user.id,
      fileName: req.file.originalname,
      matchScore: score,
      matchedKeywords: [...new Set(matched)],
      missingSkills: [...new Set(missing)]
    });

    res.status(200).json(scan);
  } catch (error) {
    res.json([]);
  }
};