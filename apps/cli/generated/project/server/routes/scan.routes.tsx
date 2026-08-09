import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';
import { authGuard } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', authGuard, upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!req.file || !jobDescription) return res.status(400).json({ error: 'Missing data' });

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // NLP Keyword extraction
    const rawKeywords = jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueKeywords = Array.from(new Set(rawKeywords));
    
    const matched: string[] = [];
    const missing: string[] = [];
    
    uniqueKeywords.forEach(kw => {
      resumeText.includes(kw) ? matched.push(kw) : missing.push(kw);
    });

    const matchScore = Math.round((matched.length / uniqueKeywords.length) * 100);

    const scan = await prisma.scan.create({
      data: {
        userId: (req as any).user.id,
        fileName: req.file.originalname,
        matchScore,
        matchedKeywords: matched,
        missingKeywords: missing
      }
    });

    res.json(scan);
  } catch (err) {
    res.json([]);
  }
});

export default router;