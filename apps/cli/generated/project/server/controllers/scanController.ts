import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import natural from 'natural';

const tokenizer = new natural.WordTokenizer();

export const analyzeMatch = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume file required' });
    
    const { targetKeywords } = req.body;
    const keywords: string[] = JSON.parse(targetKeywords);
    
    const data = await pdfParse(req.file.buffer);
    const tokens = tokenizer.tokenize(data.text.toLowerCase()) || [];
    
    const matched = keywords.filter(kw => tokens.includes(kw.toLowerCase()));
    const missing = keywords.filter(kw => !tokens.includes(kw.toLowerCase()));
    const score = Math.round((matched.length / keywords.length) * 100);

    res.json({
      matchScore: score,
      matchedKeywords: matched,
      missingKeywords: missing,
      fileName: req.file.originalname,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.json([]);
  }
};