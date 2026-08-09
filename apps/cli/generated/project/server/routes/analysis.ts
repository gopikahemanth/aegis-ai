import express, { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { z } from 'zod';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const scanSchema = z.object({
  jobDescription: z.string().min(50),
});

router.post('/scan', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume PDF is required.' });
    
    const { jobDescription } = scanSchema.parse(req.body);
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();

    // Tokenization logic
    const tokens = jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueKeywords = Array.from(new Set(tokens));
    
    const matched: string[] = [];
    const missing: string[] = [];

    uniqueKeywords.forEach(word => {
      if (resumeText.includes(word)) matched.push(word);
      else missing.push(word);
    });

    const matchScore = (matched.length / uniqueKeywords.length) * 100;

    res.json({
      matchScore: Math.round(matchScore),
      matchedKeywords: matched,
      missingKeywords: missing,
      totalKeywordsChecked: uniqueKeywords.length
    });
  } catch (error) {
    res.json([]);
  }
});

export default router;