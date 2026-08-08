import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobDescription } = req.body;
    if (!req.file || !jobDescription) {
      res.status(400).json({ error: 'Resume file and Job Description required' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // Extract meaningful keywords
    const keywords = [...new Set(jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g))]
      .filter(word => !['your', 'with', 'this', 'that', 'from'].includes(word));

    const matched = keywords.filter(k => resumeText.includes(k));
    const score = keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0;

    res.json({
      score,
      matchedKeywords: matched,
      missingKeywords: keywords.filter(k => !matched.includes(k)),
      totalChecked: keywords.length
    });
  } catch (error) {
    res.json([]);
  }
};