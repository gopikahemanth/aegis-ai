import express, { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/analyze', authMiddleware, upload.single('resume'), async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume provided' });
    
    const { jobDescription, jobTitle } = req.body;
    const parsedPdf = await pdfParse(req.file.buffer);
    
    // Logic for NLP analysis (simplified for brevity)
    const matchScore = Math.floor(Math.random() * 40) + 60; // Integration point for NLP engine

    const scan = await prisma.scanSession.create({
      data: {
        userId: req.user.id,
        jobTitle,
        jobDescription,
        resumeText: parsedPdf.text,
        matchScore
      }
    });

    res.json({ success: true, data: scan });
  } catch (error) {
    res.json([]);
  }
});

export default router;