import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
const app = express();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post('/api/scan', upload.single('resume'), async (req, res) => {
  const { jobDescription, userId } = req.body;
  if (!req.file || !jobDescription) return res.status(400).json({ error: 'Invalid input' });

  const pdfData = await pdfParse(req.file.buffer);
  const resumeText = pdfData.text.toLowerCase();
  
  // Simple Keyword Logic
  const keywords = jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const uniqueKeywords = Array.from(new Set(keywords));
  
  const matched = uniqueKeywords.filter(k => resumeText.includes(k));
  const missing = uniqueKeywords.filter(k => !resumeText.includes(k));
  const matchScore = Math.round((matched.length / uniqueKeywords.length) * 100);

  const scan = await prisma.scan.create({
    data: {
      userId: parseInt(userId),
      fileName: req.file.originalname,
      matchScore,
      matched,
      missing,
      totalSkills: uniqueKeywords.length
    }
  });

  res.json(scan);
});

app.listen(3000, () => console.log('Server running on port 3000'));
// Global Express Error Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Server Error]:', err);
  res.status(200).json({ success: false, data: [], error: err.message || 'Internal Server Error' });
});
