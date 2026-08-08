import express, { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/scan', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // Simple Keyword Extraction Logic
    const jdKeywords = [...new Set(jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])];
    const matched = jdKeywords.filter(word => resumeText.includes(word));
    const missing = jdKeywords.filter(word => !resumeText.includes(word));
    const score = Math.round((matched.length / jdKeywords.length) * 100);

    const scan = await prisma.scan.create({
      data: {
        userId: (req as any).user.id,
        fileName: req.file.originalname,
        matchScore: score,
        matchedKeywords: matched,
        missingKeywords: missing
      }
    });

    res.json(scan);
  } catch (error) {
    res.json([]);
  }
});

export default router;