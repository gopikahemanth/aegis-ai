import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Resume PDF is required.' });
      return;
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
      res.status(400).json({ error: 'Job description content is required.' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // NLP Keyword extraction: Filtering common noise
    const stopWords = new Set(['and', 'the', 'to', 'a', 'of', 'in', 'for', 'is', 'on', 'with', 'an', 'this', 'that', 'are']);
    const jdKeywords = Array.from(new Set(
      jobDescription.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter((w: string) => w.length > 3 && !stopWords.has(w))
    ));

    const matched = jdKeywords.filter((word) => resumeText.includes(word as string));
    const missing = jdKeywords.filter((word) => !resumeText.includes(word as string));
    
    const matchScore = Math.round((matched.length / Math.max(jdKeywords.length, 1)) * 100);

    res.status(200).json({
      matchScore,
      matched,
      missing,
      totalKeywords: jdKeywords.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json([]);
  }
};