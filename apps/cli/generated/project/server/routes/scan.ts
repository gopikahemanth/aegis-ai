import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', authenticate, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const { jobDescription } = req.body;
    
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // Logic for extraction & matching
    const jdWords = jobDescription.toLowerCase().match(/\b(\w+)\b/g) || [];
    const uniqueKeywords = Array.from(new Set(jdWords.filter((w: string) => w.length > 3)));
    
    const matchedKeywords = uniqueKeywords.filter(k => resumeText.includes(k));
    const score = Math.round((matchedKeywords.length / uniqueKeywords.length) * 100);

    res.json({ matchScore: score, matchedKeywords, missingKeywords: uniqueKeywords.filter(k => !matchedKeywords.includes(k)) });
  } catch (err) {
    res.json([]);
  }
});

export default router;