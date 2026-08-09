import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const extractKeywords = (text: string): string[] => {
  const stopwords = new Set(['and', 'the', 'to', 'a', 'of', 'in', 'for', 'is', 'on', 'that', 'with']);
  return Array.from(new Set(
    text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopwords.has(w))
  ));
};

router.post('/process', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { jobDescription, jobTitle } = req.body;
    if (!req.file || !jobDescription) return res.status(400).json({ error: 'Missing input' });

    const pdfData = await pdfParse(req.file.buffer);
    const resumeKws = extractKeywords(pdfData.text);
    const jobKws = extractKeywords(jobDescription);
    
    const matched = jobKws.filter(kw => resumeKws.includes(kw));
    const score = Math.round((matched.length / (jobKws.length || 1)) * 100);

    const result = await prisma.analysisResult.create({
      data: {
        userId: (req as any).user.id,
        jobTitle,
        matchScore: score,
        matchedKeywords: matched,
        missingKeywords: jobKws.filter(kw => !matched.includes(kw))
      }
    });

    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

export default router;