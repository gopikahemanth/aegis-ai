import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export async function parseResumeAndCalculateMatch(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Resume PDF is required.' });
      return;
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
      res.status(400).json({ error: 'Job description is required.' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();

    const rawKeywords = jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9\+\#\.\s]/g, '')
      .split(/\s+|,|\n/)
      .filter((w: string) => w.length > 3);

    const uniqueKeywords = Array.from(new Set<string>(rawKeywords));
    const matchedKeywords = uniqueKeywords.filter(kw => resumeText.includes(kw));
    const missingKeywords = uniqueKeywords.filter(kw => !resumeText.includes(kw));

    const matchScore = uniqueKeywords.length > 0 
      ? Math.round((matchedKeywords.length / uniqueKeywords.length) * 100)
      : 0;

    res.status(200).json({
      matchScore,
      matchedKeywords,
      missingKeywords,
      totalChecked: uniqueKeywords.length
    });
  } catch (error) {
    res.json([]);
  }
}