import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobDescription } = req.body;
    if (!req.file || !jobDescription) {
      res.status(400).json({ error: 'Missing resume file or job description' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // Extract keywords from JD (alphanumeric words > 3 chars)
    const jdKeywords = Array.from(new Set(jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) || []));
    
    const matched: string[] = [];
    const missing: string[] = [];

    jdKeywords.forEach(keyword => {
      if (resumeText.includes(keyword)) matched.push(keyword);
      else missing.push(keyword);
    });

    const matchScore = jdKeywords.length > 0 
      ? Math.round((matched.length / jdKeywords.length) * 100) 
      : 0;

    res.json({ matchScore, matched, missing });
  } catch (error) {
    res.json([]);
  }
};