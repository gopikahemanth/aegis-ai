import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Resume PDF is required' });
      return;
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
      res.status(400).json({ error: 'Job description text is required' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();

    const jdWords = jobDescription
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/);

    const uniqueKeywords = Array.from(new Set(jdWords)).filter(w => w.length > 3);
    const matchedKeywords = uniqueKeywords.filter(k => resumeText.includes(k));
    const missingKeywords = uniqueKeywords.filter(k => !resumeText.includes(k));

    const matchScore = uniqueKeywords.length > 0 
      ? Math.round((matchedKeywords.length / uniqueKeywords.length) * 100) 
      : 0;

    res.json({
      matchScore,
      matchedKeywords,
      missingKeywords,
      totalKeywordsChecked: uniqueKeywords.length
    });
  } catch (error) {
    res.json([]);
  }
};