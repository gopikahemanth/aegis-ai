import { Request, Response } from 'express';
import pdf from 'pdf-parse';
import natural from 'natural';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'Missing file or job description' });
    }

    const pdfData = await pdf(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // Simple Keyword Extraction Logic
    const keywords = jobDescription.toLowerCase().split(/[ ,]+/);
    const matchedKeywords = keywords.filter((k: string) => resumeText.includes(k) && k.length > 3);
    const missingSkills = keywords.filter((k: string) => !resumeText.includes(k) && k.length > 3);
    
    const score = Math.round((matchedKeywords.length / (keywords.length || 1)) * 100);

    res.json({
      score,
      matchedKeywords: [...new Set(matchedKeywords)],
      missingSkills: [...new Set(missingSkills)]
    });
  } catch (error) {
    res.json([]);
  }
};